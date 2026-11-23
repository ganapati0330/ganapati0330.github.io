/* ===== フテ猫 戦国合戦 : UI ===== */
'use strict';

// ---- スマホを 縦に もったら、画面ぜんたいを 90度 まわして 横長で 表示する ----
// （iPhone は 画面の 向きを プログラムで かえられない ので、CSS で まわす）
// ROT のとき、ゲームの 中の 座標（論理）と 画面の 座標（物理）は：論理x = 物理y、論理y = 画面の はば − 物理x
var ROT = false;
function isPhone() { return (navigator.maxTouchPoints > 0 || 'ontouchstart' in window) && Math.min(screen.width, screen.height) < 600; }
function applyRot() {
  var b = document.body; if (!b) return;
  var w = window.innerWidth, h = window.innerHeight;
  ROT = isPhone() && h > w;
  var lw = ROT ? h : w, lh = ROT ? w : h, st = b.style;
  b.classList.toggle('rot', ROT);
  if (ROT) { st.width = h + 'px'; st.height = w + 'px'; st.transform = 'translateX(' + w + 'px) rotate(90deg)'; }
  else { st.width = ''; st.height = ''; st.transform = ''; }
  var r = document.documentElement.style; r.setProperty('--vw', (lw / 100) + 'px'); r.setProperty('--vh', (lh / 100) + 'px');
  [['mw420', lw <= 420], ['mw480', lw <= 480], ['mw520', lw <= 520], ['mh520', lh <= 520], ['side', lw >= lh * 1.1]].forEach(function (c) { b.classList.toggle(c[0], c[1]); });
}
// ポインタの 位置を その 要素の 中の 座標（論理）に する
function evPt(e, el) { var rc = el.getBoundingClientRect(); return ROT ? [e.clientY - rc.top, rc.right - e.clientX] : [e.clientX - rc.left, e.clientY - rc.top]; }
window.addEventListener('resize', applyRot);
window.addEventListener('orientationchange', function () { setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 350); });
// 上の バーの 高さを CSS に つたえる（右がわの パネルを その 下から はじめる）
function hudWatch() {
  [['khud', '--khudH'], ['dhud', '--dhudH'], ['hud', '--hudH']].forEach(function (a) {
    var el = document.getElementById(a[0]); if (!el) return;
    var set = function () { if (el.offsetHeight) document.documentElement.style.setProperty(a[1], el.offsetHeight + 'px'); };
    if (window.ResizeObserver) new ResizeObserver(set).observe(el);
    window.addEventListener('resize', set); set();
  });
}
document.addEventListener('DOMContentLoaded', function () { applyRot(); hudWatch(); });
applyRot();
var $ = function (id) { return document.getElementById(id); };
var SQ3 = Math.sqrt(3);
var R = 40; // hex size (world units)

// ---- スプライト読み込み ----
var IMGS = {};
(function () {
  Object.keys(SPR).forEach(function (k) { var im = new Image(); im.src = SPR[k]; IMGS[k] = im; });
})();
var ART_ALIAS = { '津軽為信':'大浦為信' };
function lordArt(name) { if (typeof LORD_ART === 'undefined') return null; return LORD_ART[name] || LORD_ART[ART_ALIAS[name]] || null; }
function getImg(key) {
  if (IMGS[key]) return IMGS[key];
  if (key && key.indexOf('art:') === 0) { var src = lordArt(key.slice(4)); if (src) { var im = new Image(); im.src = src; IMGS[key] = im; return im; } }
  return null;
}
function charById(id) {
  if (id && id.indexOf('art:') === 0) return { id: id, name: id.slice(4), spr: id, win: null, lose: null };
  if (id && id.indexOf('clan:') === 0 && typeof CLANS !== 'undefined') { var c = CLANS[id.slice(5)]; return { id: id, name: c.lord, spr: null, crest: c.crest, color: c.color, win: null, lose: null }; }
  for (var i = 0; i < CHARS.length; i++) if (CHARS[i].id === id) return CHARS[i]; return CHARS[0];
}
function generalName(u) { return (G && G.generals && G.generals[u.side]) ? G.generals[u.side].name : charById(u.charId).name; }

// ---- サウンド（Web Audio） ----
var AC = null;
function audio() {
  if (!AC) {
    // iPhone：マナーモードでも 音が でるように（Safari 17〜）
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
    try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; }
  }
  // suspended（はじめ）・interrupted（アプリ切りかえ・画面ロックの あと）なら また ならす
  if (AC && AC.state !== 'running' && AC.state !== 'closed') { try { var pr = AC.resume(); if (pr && pr.catch) pr.catch(function () {}); } catch (e) {} }
  return AC;
}
// タップした ときに 音を 出せるように する（iPhone は タップの 中で ないと 音が でない）
var audioUnlocked = false, keepAlive = null;
function silentWavUrl() {
  var n = 4000, buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
  function ws(o, t) { for (var i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); }
  ws(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); ws(8, 'WAVE'); ws(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true); v.setUint32(28, 16000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); ws(36, 'data'); v.setUint32(40, n * 2, true);
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
}
function unlockAudio() {
  var ac = audio(); if (!ac) return;
  if (!audioUnlocked) {
    audioUnlocked = true;
    try { var b = ac.createBuffer(1, 1, 22050), src = ac.createBufferSource(); src.buffer = b; src.connect(ac.destination); src.start(0); } catch (e) {}
    // むかしの iPhone：音の ない 音声を ながしつづけると マナーモードでも Web Audio が きこえる
    if (!navigator.audioSession) { try { keepAlive = new Audio(silentWavUrl()); keepAlive.loop = true; keepAlive.setAttribute('playsinline', ''); var pp = keepAlive.play(); if (pp && pp.catch) pp.catch(function () {}); } catch (e) {} }
  } else if (keepAlive && keepAlive.paused) { try { var p2 = keepAlive.play(); if (p2 && p2.catch) p2.catch(function () {}); } catch (e) {} }
  if (BGM.on && !BGM.src) bgmStart();
}
function tone(f, dur, type, vol, slide) {
  var ac = audio(); if (!ac) return;
  var o = ac.createOscillator(), g = ac.createGain();
  o.type = type || 'square'; o.frequency.setValueAtTime(f, ac.currentTime);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), ac.currentTime + dur);
  g.gain.setValueAtTime(vol || 0.12, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
  o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + dur + 0.02);
}
function noise(dur, vol) {
  var ac = audio(); if (!ac) return;
  var n = ac.sampleRate * dur, buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0);
  for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  var s = ac.createBufferSource(), g = ac.createGain(); s.buffer = buf; g.gain.value = vol || 0.2;
  var f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1200;
  s.connect(f); f.connect(g); g.connect(ac.destination); s.start();
}
// ---- BGM ----
var BGM = { buf: null, src: null, gain: null, on: true, loading: false };
try { BGM.on = localStorage.getItem('aomori-sengoku-bgm') !== 'off'; } catch (e) {}
function bgmLoad() {
  var ac = audio(); if (!ac || BGM.buf || BGM.loading) return;
  BGM.loading = true;
  fetch('bgm.mp3').then(function (r) { if (!r.ok) throw new Error('bgm'); return r.arrayBuffer(); })
    .then(function (ab) { return new Promise(function (ok, ng) { ac.decodeAudioData(ab, ok, ng); }); })
    .then(function (b) { BGM.buf = b; BGM.loading = false; if (BGM.on) bgmPlay(); })
    .catch(function () { BGM.loading = false; });
}
function bgmPlay() {
  var ac = audio(); if (!ac || !BGM.buf || BGM.src) return;
  if (!BGM.gain) { BGM.gain = ac.createGain(); BGM.gain.connect(ac.destination); }
  BGM.gain.gain.setValueAtTime(0, ac.currentTime); BGM.gain.gain.linearRampToValueAtTime(0.32, ac.currentTime + 1.2);
  var s = ac.createBufferSource(); s.buffer = BGM.buf; s.loop = true; s.connect(BGM.gain); s.start(); BGM.src = s;
}
function bgmStop() { if (BGM.src) { try { BGM.src.stop(); } catch (e) {} BGM.src = null; } }
function bgmToggle() {
  BGM.on = !BGM.on;
  try { localStorage.setItem('aomori-sengoku-bgm', BGM.on ? 'on' : 'off'); } catch (e) {}
  if (BGM.on) { if (BGM.buf) bgmPlay(); else bgmLoad(); } else bgmStop();
  bgmLabel();
}
function bgmLabel() { ['bgmBtn', 'bgmBtn2', 'bgmBtn3'].forEach(function (id) { var b = $(id); if (b) b.textContent = BGM.on ? '🔊' : '🔇'; }); }
function bgmStart() { audio(); if (BGM.on) { if (BGM.buf) bgmPlay(); else bgmLoad(); } }
var SFX = {
  tap: function () { tone(880, 0.06, 'square', 0.06); },
  move: function () { tone(440, 0.08, 'triangle', 0.08, 200); },
  hit: function () { noise(0.15, 0.25); tone(160, 0.15, 'sawtooth', 0.12, -80); },
  gun: function () { noise(0.3, 0.4); tone(90, 0.25, 'square', 0.1, -60); },
  arrow: function () { tone(1400, 0.12, 'sine', 0.08, -900); },
  wall: function () { noise(0.25, 0.35); tone(70, 0.3, 'sawtooth', 0.15, -40); },
  gate: function () { tone(220, 0.3, 'triangle', 0.1, 120); },
  repair: function () { tone(660, 0.08, 'square', 0.08); setTimeout(function () { tone(880, 0.1, 'square', 0.08); }, 100); },
  kill: function () { tone(330, 0.1, 'square', 0.1); setTimeout(function () { tone(220, 0.25, 'square', 0.1, -100); }, 90); },
  turn: function () { tone(523, 0.1, 'triangle', 0.1); setTimeout(function () { tone(784, 0.18, 'triangle', 0.1); }, 110); },
  win: function () { [523, 659, 784, 1047].forEach(function (f, i) { setTimeout(function () { tone(f, 0.3, 'triangle', 0.12); }, i * 130); }); },
  lose: function () { [392, 349, 311, 262].forEach(function (f, i) { setTimeout(function () { tone(f, 0.35, 'triangle', 0.1); }, i * 180); }); }
};

// ---- 設定状態 ----
var setup = { side: 'atk', mapIndex: 0, sizeIndex: 0, mapSeed: 1 + Math.floor(Math.random() * 1e9), playerChar: 'fute', cpuChar: 'kuro', difficulty: 'normal', army: null };
function resetArmy() { setup.army = defaultArmy(setup.side, setup.sizeIndex, setup.mapIndex); }
var G = null;
var cam = { x: 0, y: 0, s: 1 };
var canvas, ctx, W = 0, H = 0, DPR = 1;
var sel = null;          // 選択中ユニット
var reach = null;        // 到達可能
var phase = 'idle';      // idle / moved / cpu / anim
var targets = [];        // {kind, unit|tile}
var anim = [];           // アニメーション中のフローティングテキスト等
var moveAnim = null;     // {unit, path, t}
var cpuBusy = false;
var hoverInfo = null;

// ---- 画面切替 ----
function show(id) {
  ['title', 'setupScreen', 'gameScreen', 'clanScreen', 'mapScreen', 'domScreen'].forEach(function (s) { $(s).classList.toggle('on', s === id); });
}

// ---- セットアップ画面 ----
function initSetup() {
  resetArmy();
  renderSetup();
}
function renderSetup() {
  $('sideAtk').classList.toggle('sel', setup.side === 'atk');
  $('sideDef').classList.toggle('sel', setup.side === 'def');
  var mapBox = $('mapList'); mapBox.innerHTML = '';
  CASTLES.forEach(function (m, i) {
    if (m.real) return;   // 実在の 城は 国取りで
    var b = document.createElement('button'); b.className = 'opt castle' + (i === setup.mapIndex ? ' sel' : '');
    b.innerHTML = '<b>' + m.name + '</b><small>' + m.kana + '</small>';
    b.onclick = function () { SFX.tap(); setup.mapIndex = i; resetArmy(); renderSetup(); };
    mapBox.appendChild(b);
  });
  $('mapDesc').textContent = CASTLES[setup.mapIndex].desc;
  var sz = $('sizeList'); sz.innerHTML = '';
  SIZES.forEach(function (s, i) {
    var b = document.createElement('button'); b.className = 'opt' + (i === setup.sizeIndex ? ' sel' : '');
    b.innerHTML = '<b>' + s.name + '</b><small>' + s.w + '×' + s.h + '・' + s.turns + 'ターン</small>';
    b.onclick = function () { SFX.tap(); setup.sizeIndex = i; resetArmy(); renderSetup(); };
    sz.appendChild(b);
  });
  drawPreview();
  var cb = $('charList'); cb.innerHTML = '';
  CHARS.forEach(function (ch) {
    var b = document.createElement('button'); b.className = 'charbtn' + (ch.id === setup.playerChar ? ' sel' : '');
    b.innerHTML = '<img src="' + SPR[ch.spr] + '" alt=""><span>' + ch.name + '</span>';
    b.onclick = function () { SFX.tap(); setup.playerChar = ch.id; if (setup.cpuChar === ch.id) setup.cpuChar = ch.id === 'kuro' ? 'fute' : 'kuro'; renderSetup(); };
    cb.appendChild(b);
  });
  var eb = $('enemyList'); eb.innerHTML = '';
  CHARS.forEach(function (ch) {
    if (ch.id === setup.playerChar) return;
    var b = document.createElement('button'); b.className = 'charbtn small' + (ch.id === setup.cpuChar ? ' sel' : '');
    b.innerHTML = '<img src="' + SPR[ch.spr] + '" alt=""><span>' + ch.name + '</span>';
    b.onclick = function () { SFX.tap(); setup.cpuChar = ch.id; renderSetup(); };
    eb.appendChild(b);
  });
  ['easy', 'normal', 'hard'].forEach(function (d) { $('dif_' + d).classList.toggle('sel', setup.difficulty === d); });
  // 編成
  var pts = pointsFor(setup.side, setup.sizeIndex, setup.mapIndex), used = armyCost(setup.army), cnt = armyCount(setup.army) + 1, maxU = maxUnitsFor(setup.sizeIndex);
  $('ptsInfo').textContent = 'つかえる点：' + pts + '　つかった点：' + used + '　のこり：' + (pts - used) + '　へいの数：' + cnt + '/' + maxU;
  var ab = $('armyList'); ab.innerHTML = '';
  BUY_ORDER.forEach(function (k) {
    var T = UNIT_TYPES[k];
    var row = document.createElement('div'); row.className = 'arow';
    var canAdd = used + T.cost <= pts && cnt < maxU;
    row.innerHTML = '<span class="uic ' + (setup.side === 'atk' ? 'blue' : 'blue') + '">' + T.ch + '</span>' +
      '<span class="uname"><b>' + T.name + '隊（' + T.men + menUnit(k) + '）</b><small>' + T.cost + '点　攻' + T.atk + ' 守' + T.def + ' 移' + T.mov + ' 射' + (T.rmin === T.rmax ? T.rmin : T.rmin + '〜' + T.rmax) + '</small></span>' +
      '<button class="pm" data-k="' + k + '" data-d="-1"' + (setup.army[k] <= 0 ? ' disabled' : '') + '>－</button>' +
      '<span class="num">' + setup.army[k] + '</span>' +
      '<button class="pm" data-k="' + k + '" data-d="1"' + (canAdd ? '' : ' disabled') + '>＋</button>';
    ab.appendChild(row);
  });
  Array.prototype.forEach.call(ab.querySelectorAll('.pm'), function (b) {
    b.onclick = function () { SFX.tap(); var k = b.getAttribute('data-k'), d = +b.getAttribute('data-d'); setup.army[k] = Math.max(0, setup.army[k] + d); renderSetup(); };
  });
  var armyDesc = $('armyDesc'); armyDesc.innerHTML = '';
  BUY_ORDER.concat(['taisho']).forEach(function (k) { var T = UNIT_TYPES[k]; var p = document.createElement('p'); p.innerHTML = '<b>' + T.name + '（' + T.kana + '）</b> <span class="st">攻' + T.atk + ' 守' + T.def + ' 移' + T.mov + ' 射' + (T.rmin === T.rmax ? T.rmin : T.rmin + '〜' + T.rmax) + '</span> ' + T.desc; armyDesc.appendChild(p); });
}

// ---- ちずの プレビュー ----
var PCOL = { '.':'#9fd27a', '=':'#d9c08a', f:'#3f8a3a', h:'#b9c66a', m:'#7a706a', r:'#5fb0e8', b:'#c59a5a', W:'#8d8d93', P:'#a2743f', G:'#5b3d20', C:'#e6d6a8', K:'#d9452f', s:'#3a7fc0' };
function drawPreview() {
  var cv = $('preview'); if (!cv) return;
  var rows = generateRows(CASTLES[setup.mapIndex], SIZES[setup.sizeIndex], setup.mapSeed);
  var w = rows[0].length, h = rows.length;
  var cw = cv.offsetWidth || 300, dpr = Math.min(2, window.devicePixelRatio || 1);
  var hs = Math.min(cw / ((w + 0.5) * SQ3 + 1), 260 / ((h - 1) * 1.5 + 2.2));
  var ch = Math.ceil(((h - 1) * 1.5 + 2.2) * hs);
  cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); cv.style.height = ch + 'px';
  var c2 = cv.getContext('2d'); c2.setTransform(dpr, 0, 0, dpr, 0, 0); c2.clearRect(0, 0, cw, ch);
  var ox = (cw - (w + 0.5) * SQ3 * hs) / 2;
  for (var r = 0; r < h; r++) for (var c = 0; c < w; c++) {
    var x = ox + hs * SQ3 * (c + 0.5 * (r & 1)) + hs * SQ3 / 2, y = hs * 1.5 * r + hs * 1.1;
    c2.beginPath();
    for (var i = 0; i < 6; i++) { var a = Math.PI / 180 * (60 * i - 30); var px = x + hs * Math.cos(a), py = y + hs * Math.sin(a); if (i) c2.lineTo(px, py); else c2.moveTo(px, py); }
    c2.closePath(); c2.fillStyle = PCOL[rows[r][c]] || '#9fd27a'; c2.fill();
  }
  // 出陣地
  c2.fillStyle = 'rgba(47,111,224,.25)'; c2.fillRect(0, hs * 1.5 * (h - 4) + hs * 0.2, cw, ch);
  c2.fillStyle = '#1d4fb0'; c2.font = 'bold 11px sans-serif'; c2.textAlign = 'left'; c2.fillText('▼ せめての しゅつじん ばしょ', 6, ch - 5);
}

// ---- ゲーム開始 ----
function startGame() {
  var cpuArmy = defaultArmy(setup.side === 'atk' ? 'def' : 'atk', setup.sizeIndex, setup.mapIndex);
  if (setup.difficulty === 'easy') { cpuArmy.ashigaru = Math.max(1, cpuArmy.ashigaru - 1); if (cpuArmy.kiba) cpuArmy.kiba--; else cpuArmy.yumi = Math.max(0, cpuArmy.yumi - 1); }
  if (setup.difficulty === 'hard') { cpuArmy.ashigaru += 1; cpuArmy.yumi += 1; }
  G = newGame({ mapIndex: setup.mapIndex, sizeIndex: setup.sizeIndex, mapSeed: setup.mapSeed, playerSide: setup.side, playerChar: setup.playerChar, cpuChar: setup.cpuChar,
                playerArmy: setup.army, cpuArmy: cpuArmy, difficulty: setup.difficulty });
  beginBattle('かっせん はじまり！ ' + (G.playerSide === 'atk' ? 'しろを せめろ' : 'しろを まもれ') + '（' + G.castle.name + '・' + G.turnLimit + 'ターン）');
}
function beginBattle(intro, resumed) {
  sel = null; reach = null; targets = []; anim = []; FX = []; FALLEN = []; STAMP = null; terrCache = null; phase = 'idle'; hoverInfo = null; LOG = []; undoPos = null; moveAnim = null; clearUndo();
  show('gameScreen');
  logMsg(intro, 'sys');
  resize(); startCamera(); lastPanelH = bottomH();
  updateHud();
  if (G.side !== G.playerSide) setTimeout(cpuTurn, 600);
  else if (resumed) banner('つづきから！ あなたの ばん', 1400);
  else if (gx('shutsujin')) { stamp('shutsujin', 1.5); setTimeout(function () { banner(G.playerSide === 'atk' ? 'しろを せめろ！' : 'しろを まもれ！', 1400); }, 1300); }
  else banner(G.playerSide === 'atk' ? 'しろを せめろ！' : 'しろを まもれ！', 1400);
  $('resultBox').classList.remove('on');
}

// ---- カメラ・座標 ----
function hexCenter(c, r) { return [R * SQ3 * (c + 0.5 * (r & 1)) + R, R * 1.5 * r + R]; }
function worldToHex(x, y) {
  x -= R; y -= R;
  var q = (SQ3 / 3 * x - y / 3) / R, rr = (2 / 3 * y) / R;
  var cx = q, cz = rr, cy = -cx - cz;
  var rx = Math.round(cx), ry = Math.round(cy), rz = Math.round(cz);
  var dx = Math.abs(rx - cx), dy = Math.abs(ry - cy), dz = Math.abs(rz - cz);
  if (dx > dy && dx > dz) rx = -ry - rz; else if (dy > dz) ry = -rx - rz; else rz = -rx - ry;
  var r2 = rz, c2 = rx + ((r2 - (r2 & 1)) >> 1);
  return [c2, r2];
}
function screenToWorld(sx, sy) { return [(sx - cam.x) / cam.s, (sy - cam.y) / cam.s]; }
function mapBounds() { var w = R * SQ3 * (G.map.w + 0.5) + R * 1.0, h = R * 1.5 * (G.map.h - 1) + 2 * R + R; return [w, h]; }
function fitCamera() {
  var b = mapBounds();
  var hudTop = ($('hud').offsetHeight || 56) + 6, hudBot = bottomH() + 10;
  var availH = H - hudTop - hudBot;
  cam.s = Math.min(W / b[0], availH / b[1]) * 0.98;
  cam.s = Math.max(0.15, cam.s);
  cam.x = (W - b[0] * cam.s) / 2; cam.y = hudTop + (availH - b[1] * cam.s) / 2;
}
var camMode = 'fit';
var lastPanelH = 0;
function sideMode() { return document.body.classList.contains('side'); }
function bottomH() { return sideMode() ? 0 : ($('bottom').offsetHeight || 120); }
function panelH() { return bottomH() + 10; }
// 下パネルの高さが変わったら、地図が隠れないように ずらす
function keepAbovePanel() {
  if (!G) return;
  var h = bottomH();
  if (lastPanelH && h !== lastPanelH) { cam.y -= (h - lastPanelH); clampCam(); }
  lastPanelH = h;
}
// その兵が パネルや 上のバーに かくれていたら 見える位置まで うごかす
function ensureVisible(u) {
  var p = hexCenter(u.c, u.r), sx = cam.x + p[0] * cam.s, sy = cam.y + p[1] * cam.s;
  var top = ($('hud').offsetHeight || 56) + R * cam.s + 4, bot = H - panelH() - R * cam.s;
  if (sy > bot) cam.y -= (sy - bot); else if (sy < top) cam.y += (top - sy);
  if (sx < R * cam.s) cam.x += R * cam.s - sx; else if (sx > W - R * cam.s) cam.x -= sx - (W - R * cam.s);
}
function startCamera() {
  fitCamera();
  if (cam.s >= 0.5) { camMode = 'fit'; return; }
  // 大きい マップは じぶんの 大将の まわりを 大きめに
  var g0 = general(G, G.playerSide), p = hexCenter(g0.c, g0.r);
  var hudTop = ($('hud').offsetHeight || 56) + 6, hudBot = bottomH() + 10;
  cam.s = Math.min(0.62, Math.max(0.5, W / 900));
  cam.x = W / 2 - p[0] * cam.s; cam.y = hudTop + (H - hudTop - hudBot) / 2 - p[1] * cam.s;
  clampCam(); camMode = 'near';
}
function toggleCamera() {
  if (camMode === 'near') { fitCamera(); camMode = 'fit'; return; }
  var c0 = sel || general(G, G.playerSide), p = hexCenter(c0.c, c0.r);
  var hudTop = ($('hud').offsetHeight || 56) + 6, hudBot = bottomH() + 10;
  var target = Math.min(1, Math.max(0.55, cam.s * 1.8));
  cam.s = target; cam.x = W / 2 - p[0] * cam.s; cam.y = hudTop + (H - hudTop - hudBot) / 2 - p[1] * cam.s; clampCam(); camMode = 'near';
}
function clampCam() {
  var b = mapBounds(); var mw = b[0] * cam.s, mh = b[1] * cam.s;
  var minX = Math.min(40, W - mw - 40), maxX = Math.max(W - mw - 40, 40);
  var hb = panelH(), ht = ($('hud').offsetHeight || 56) + 6;
  var minY = Math.min(ht, H - mh - hb), maxY = Math.max(H - mh - hb, ht);
  cam.x = Math.max(minX, Math.min(maxX, cam.x)); cam.y = Math.max(minY, Math.min(maxY, cam.y));
}
function resize() {
  DPR = Math.min(2, window.devicePixelRatio || 1);
  W = canvas.offsetWidth; H = canvas.offsetHeight;
  canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
}

// ---- 描画 ----
var TCOL = { plain: '#9fd27a', road: '#d9c08a', forest: '#5aa14a', hill: '#b9c66a', mount: '#9a8f86', river: '#5fb0e8', bridge: '#c59a5a',
             wall: '#8d8d93', gate: '#8d6a3f', court: '#e6d6a8', keep: '#f1e6c8', peak: '#6d5f55' };
function hexPath(x, y, s) {
  ctx.beginPath();
  for (var i = 0; i < 6; i++) { var a = Math.PI / 180 * (60 * i - 30); var px = x + s * Math.cos(a), py = y + s * Math.sin(a); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
  ctx.closePath();
}
function drawTile(t) {
  var p = hexCenter(t.c, t.r), x = p[0], y = p[1];
  hexPath(x, y, R); ctx.fillStyle = TCOL[t.terr]; ctx.fill();
  if (t.ch === 'W' && t.broken) { ctx.fillStyle = '#bdb59d'; ctx.fill(); }
  if (t.ch === 'G' && t.broken) { ctx.fillStyle = '#c2b088'; ctx.fill(); }
  ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1.5; ctx.stroke();
  // 装飾
  ctx.save();
  switch (t.ch) {
    case 'f':
      for (var i = 0; i < 3; i++) { var ox = [-12, 10, -2][i], oy = [6, 8, -8][i];
        ctx.fillStyle = '#2f7a2f'; ctx.beginPath(); ctx.moveTo(x + ox, y + oy - 14); ctx.lineTo(x + ox - 9, y + oy + 4); ctx.lineTo(x + ox + 9, y + oy + 4); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#6b4a2b'; ctx.fillRect(x + ox - 2, y + oy + 4, 4, 5); }
      break;
    case 'h':
      ctx.fillStyle = 'rgba(120,140,60,0.5)'; ctx.beginPath(); ctx.ellipse(x, y + 6, 22, 11, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(160,180,90,0.7)'; ctx.beginPath(); ctx.ellipse(x - 2, y + 2, 14, 7, 0, 0, Math.PI * 2); ctx.fill();
      break;
    case 'M':
      ctx.fillStyle = '#4e423a'; ctx.beginPath(); ctx.moveTo(x, y - 28); ctx.lineTo(x - 28, y + 18); ctx.lineTo(x + 28, y + 18); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#f4f4f4'; ctx.beginPath(); ctx.moveTo(x, y - 28); ctx.lineTo(x - 10, y - 12); ctx.lineTo(x + 10, y - 12); ctx.closePath(); ctx.fill();
      break;
    case 'm':
      ctx.fillStyle = '#6e6560'; ctx.beginPath(); ctx.moveTo(x, y - 22); ctx.lineTo(x - 24, y + 16); ctx.lineTo(x + 24, y + 16); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#f4f4f4'; ctx.beginPath(); ctx.moveTo(x, y - 22); ctx.lineTo(x - 8, y - 9); ctx.lineTo(x - 3, y - 6); ctx.lineTo(x + 2, y - 10); ctx.lineTo(x + 8, y - 9); ctx.closePath(); ctx.fill();
      break;
    case 'r':
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2;
      for (var j = -1; j <= 1; j++) { ctx.beginPath(); ctx.moveTo(x - 18, y + j * 10); ctx.quadraticCurveTo(x - 9, y + j * 10 - 5, x, y + j * 10); ctx.quadraticCurveTo(x + 9, y + j * 10 + 5, x + 18, y + j * 10); ctx.stroke(); }
      break;
    case 'b':
      ctx.fillStyle = '#5fb0e8'; ctx.fillRect(x - 30, y - 14, 60, 28);
      ctx.fillStyle = '#a2743f'; ctx.fillRect(x - 12, y - 26, 24, 52);
      ctx.strokeStyle = '#6b4a2b'; ctx.lineWidth = 2; for (var k = -20; k <= 20; k += 8) { ctx.beginPath(); ctx.moveTo(x - 12, y + k); ctx.lineTo(x + 12, y + k); ctx.stroke(); }
      break;
    case '=':
      ctx.fillStyle = 'rgba(0,0,0,0.06)'; ctx.fillRect(x - 10, y - R, 20, R * 2);
      break;
    case 's':
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 2;
      for (var sw = -1; sw <= 1; sw += 2) { ctx.beginPath(); ctx.arc(x - 8 + sw * 4, y + sw * 9, 7, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); ctx.beginPath(); ctx.arc(x + 8 + sw * 4, y + sw * 9, 7, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
      break;
    case 'W':
      if (!t.broken && t.wood) {
        ctx.fillStyle = '#7a5530';
        for (var pk = -22; pk <= 22; pk += 9) { ctx.fillRect(x + pk - 3, y - 18, 6, 34); ctx.beginPath(); ctx.moveTo(x + pk - 3, y - 18); ctx.lineTo(x + pk, y - 25); ctx.lineTo(x + pk + 3, y - 18); ctx.fill(); }
        ctx.fillStyle = '#5b3d20'; ctx.fillRect(x - 26, y - 6, 52, 4); ctx.fillRect(x - 26, y + 6, 52, 4);
        if (t.hp < t.maxHp) hpBar(x, y + 24, t.hp / t.maxHp);
        break;
      }
      if (!t.broken) {
        ctx.fillStyle = '#b4b4bb'; hexPath(x, y, R * 0.8); ctx.fill();
        ctx.strokeStyle = '#6f6f78'; ctx.lineWidth = 1.5;
        for (var yy = -20; yy <= 20; yy += 10) { ctx.beginPath(); ctx.moveTo(x - 26, y + yy); ctx.lineTo(x + 26, y + yy); ctx.stroke(); }
        for (var r2 = 0; r2 < 5; r2++) { var off = (r2 % 2) * 10; for (var xx = -26 + off; xx < 26; xx += 20) { ctx.beginPath(); ctx.moveTo(x + xx, y - 20 + r2 * 10); ctx.lineTo(x + xx, y - 10 + r2 * 10); ctx.stroke(); } }
        // 狭間
        ctx.fillStyle = '#eeeef2'; for (var m2 = -20; m2 <= 20; m2 += 20) ctx.fillRect(x + m2 - 4, y - 30, 8, 7);
        if (t.hp < t.maxHp) hpBar(x, y + 24, t.hp / t.maxHp);
      } else {
        ctx.fillStyle = '#8d8d93'; for (var q = 0; q < 6; q++) { ctx.beginPath(); ctx.arc(x + Math.cos(q) * 14, y + Math.sin(q * 2) * 10, 5, 0, Math.PI * 2); ctx.fill(); }
      }
      break;
    case 'G':
      if (!t.broken) {
        ctx.fillStyle = '#b4b4bb'; hexPath(x, y, R * 0.8); ctx.fill();
        ctx.fillStyle = '#5b3d20'; ctx.fillRect(x - 16, y - 20, 32, 40);
        if (t.open) { ctx.fillStyle = '#2b2b2b'; ctx.fillRect(x - 10, y - 16, 20, 36); ctx.fillStyle = '#5b3d20'; ctx.fillRect(x - 16, y - 20, 5, 40); ctx.fillRect(x + 11, y - 20, 5, 40); }
        else { ctx.strokeStyle = '#d9b36a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y - 20); ctx.lineTo(x, y + 20); ctx.stroke(); ctx.fillStyle = '#d9b36a'; [[-8, -10], [8, -10], [-8, 10], [8, 10]].forEach(function (d) { ctx.beginPath(); ctx.arc(x + d[0], y + d[1], 2.2, 0, Math.PI * 2); ctx.fill(); }); }
        ctx.fillStyle = '#4a4a52'; ctx.fillRect(x - 24, y - 28, 48, 8);
        if (t.hp < t.maxHp) hpBar(x, y + 26, t.hp / t.maxHp);
      } else {
        ctx.fillStyle = '#5b3d20'; ctx.fillRect(x - 16, y + 6, 14, 10); ctx.fillRect(x + 4, y - 2, 12, 8);
      }
      break;
    case 'K':
      ctx.fillStyle = '#8a7a5a'; ctx.fillRect(x - 24, y + 8, 48, 14);
      ctx.fillStyle = '#fbf8ef'; ctx.fillRect(x - 18, y - 6, 36, 16);
      ctx.fillStyle = '#3d4f63'; ctx.beginPath(); ctx.moveTo(x - 24, y - 6); ctx.lineTo(x, y - 14); ctx.lineTo(x + 24, y - 6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fbf8ef'; ctx.fillRect(x - 12, y - 24, 24, 12);
      ctx.fillStyle = '#3d4f63'; ctx.beginPath(); ctx.moveTo(x - 18, y - 24); ctx.lineTo(x, y - 34); ctx.lineTo(x + 18, y - 24); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#d9a23a'; ctx.beginPath(); ctx.arc(x, y - 34, 3, 0, Math.PI * 2); ctx.fill();
      break;
    case 'C':
      ctx.fillStyle = 'rgba(0,0,0,0.05)'; ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
      break;
  }
  ctx.restore();
}
// ---- 画像グラフィック（img/ フォルダ。読めないときは 上の 図形描画に もどる） ----
var GFX_NAMES = ['castle_yama', 'castle_yamas', 'castle_hirayama', 'castle_hira', 'castle_umi', 'castle_yakata', 'castle_toride', 'castle_ruin', 't_grass', 't_court', 't_water', 't_sea', 'forest', 'sakura', 'bamboo', 'hill', 'mount', 'snow', 'bridge', 'wall', 'dorui', 'gate', 'gateopen', 'gatebroken', 'rubble', 'yagura',
  'ashi_stand_b', 'ashi_stand_r', 'ashi_atk_b', 'ashi_atk_r', 'ashi_down_b', 'ashi_down_r',
  'kosaku_stand_b', 'kosaku_stand_r', 'kosaku_atk_b', 'kosaku_atk_r', 'kosaku_down_b', 'kosaku_down_r',
  'teppo_stand_b', 'teppo_stand_r', 'teppo_atk_b', 'teppo_atk_r', 'teppo_down_b', 'teppo_down_r',
  'kiba_stand_b', 'kiba_stand_r', 'kiba_atk_b', 'kiba_atk_r', 'kiba_down_b', 'kiba_down_r',
  'yumi_stand_b', 'yumi_stand_r', 'yumi_atk_b', 'yumi_atk_r', 'yumi_down_b', 'yumi_down_r',
  'taisho_stand_b', 'taisho_stand_r', 'taisho_atk_b', 'taisho_atk_r', 'taisho_down_b', 'taisho_down_r',
  'ninja_stand_b', 'ninja_stand_r', 'ninja_atk_b', 'ninja_atk_r', 'ninja_down_b', 'ninja_down_r', 'arrow', 'smoke', 'spark', 'dust', 'crumble', 'shutsujin', 'kachidoki'];
// 攻撃アニメ（4コマ）
var ANIM_UNITS = ['ashigaru', 'yumi', 'kiba', 'teppo', 'kosaku', 'ninja', 'taisho'];
ANIM_UNITS.forEach(function (u) { for (var f = 1; f <= 4; f++) GFX_NAMES.push('anim_' + u + '_' + f + '_b', 'anim_' + u + '_' + f + '_r'); });
var ATK_MS = 600;
var GFX = {};
GFX_NAMES.forEach(function (n) { var im = new Image(); im.onload = function () { terrCache = null; }; im.src = 'img/' + n + '.webp'; GFX[n] = im; });
function gx(n) { var im = GFX[n]; return im && im.complete && im.naturalWidth ? im : null; }
function gfxOn() { return !!(gx('t_grass') && gx('t_court') && gx('t_water')); }
function thash(c, r, k) { var h = (c * 374761393 + r * 668265263 + (k || 0) * 2246822519) >>> 0; h = ((h ^ (h >>> 13)) * 1274126177) >>> 0; return (h ^ (h >>> 16)) >>> 0; }
// 下の 中心を (x, by) に そろえて、幅 w で 絵を おく
function putSpr(im, x, by, w, flip) {
  var h = w * im.naturalHeight / im.naturalWidth;
  if (flip) { ctx.save(); ctx.translate(x, 0); ctx.scale(-1, 1); ctx.drawImage(im, -w / 2, by - h, w, h); ctx.restore(); }
  else ctx.drawImage(im, x - w / 2, by - h, w, h);
}
function groundTexOf(t) { return t.ch === 'r' || t.ch === 'b' ? 't_water' : t.ch === 's' ? (gx('t_sea') ? 't_sea' : 't_water') : (t.ch === 'C' || t.ch === 'K' || t.ch === 'G' || t.ch === 'W' || t.ch === '=') ? 't_court' : 't_grass'; }
function drawGround(t) {
  var p = hexCenter(t.c, t.r), x = p[0], y = p[1], im = gx(groundTexOf(t)), h = thash(t.c, t.r);
  ctx.save(); hexPath(x, y, R + 0.6); ctx.clip();
  var sw = Math.min(im.naturalWidth, im.naturalHeight) * 0.62, sx = (h % 1000) / 1000 * (im.naturalWidth - sw), sy = ((h >>> 10) % 1000) / 1000 * (im.naturalHeight - sw);
  ctx.drawImage(im, sx, sy, sw, sw, x - R, y - R, R * 2, R * 2);
  if (t.ch === '=') { ctx.fillStyle = 'rgba(214,180,120,0.45)'; ctx.fill(); }
  if (t.ch === 'h') { ctx.fillStyle = 'rgba(190,190,90,0.18)'; ctx.fill(); }
  if (t.ch === 'm') { ctx.fillStyle = 'rgba(120,110,100,0.25)'; ctx.fill(); }
  if (t.ch === 'M') { ctx.fillStyle = 'rgba(70,55,45,0.55)'; ctx.fill(); }
  if (t.bld === 'field') { ctx.fillStyle = 'rgba(233,207,90,0.55)'; ctx.fill(); ctx.strokeStyle = 'rgba(150,110,20,0.45)'; ctx.lineWidth = 1.5; for (var li = -2; li <= 2; li++) { ctx.beginPath(); ctx.moveTo(x - R * 0.75, y + li * R * 0.28); ctx.lineTo(x + R * 0.75, y + li * R * 0.28); ctx.stroke(); } }
  ctx.restore();
  hexPath(x, y, R); ctx.strokeStyle = 'rgba(40,30,10,0.22)'; ctx.lineWidth = 1.2; ctx.stroke();
}
var BLD_ICON = { town: '🏘', town0: '🏘', mine: '⛏', meibutsu: '🏺', salt: '🧂' };
function drawNature(t) {
  var p = hexCenter(t.c, t.r), x = p[0], y = p[1], h = thash(t.c, t.r, 7), im;
  if (t.bld && BLD_ICON[t.bld]) { ctx.font = Math.round(R * 1.05) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(BLD_ICON[t.bld], x, y + 2); return; }
  if (t.bld === 'field') return;
  if (t.ch === 'f') { var k = h % 20; im = gx(k < 3 ? 'sakura' : k < 6 ? 'bamboo' : 'forest') || gx('forest'); if (im) putSpr(im, x + ((h >>> 8) % 7 - 3), y + R * 0.72, R * 1.85, (h >>> 4) & 1); }
  else if (t.ch === 'h') { im = gx('hill'); if (im) putSpr(im, x, y + R * 0.6, R * 1.9, h & 1); }
  else if (t.ch === 'm') { im = gx(h % 7 === 0 ? 'snow' : 'mount') || gx('mount'); if (im) putSpr(im, x, y + R * 0.78, R * 2.0, (h >>> 3) & 1); }
  else if (t.ch === 'M') { im = gx(h % 3 ? 'snow' : 'mount') || gx('mount'); if (im) { ctx.save(); ctx.filter = 'brightness(0.78)'; putSpr(im, x, y + R * 0.85, R * 2.25, (h >>> 3) & 1); ctx.restore(); } }
  else if (t.ch === 'b') { im = gx('bridge'); if (im) putSpr(im, x, y + R * 0.62, R * 1.95); }
}
// 城の 部品（こわれる・ひらくので 毎回 かく）
function drawCastlePart(t) {
  var p = hexCenter(t.c, t.r), x = p[0], y = p[1], im;
  if (t.ch === 'W') {
    im = gx(t.broken ? 'rubble' : t.wood ? 'dorui' : 'wall');
    if (im) putSpr(im, x, y + R * 0.66, t.broken ? R * 1.8 : R * 1.95, (t.c + t.r) & 1);
    if (!t.broken && t.hp < t.maxHp) hpBar(x, y + 24, t.hp / t.maxHp);
  } else if (t.ch === 'G') {
    im = gx(t.broken ? 'gatebroken' : t.open ? 'gateopen' : 'gate');
    if (im) putSpr(im, x, y + R * 0.7, R * 1.95);
    if (!t.broken && t.hp < t.maxHp) hpBar(x, y + 26, t.hp / t.maxHp);
  } else if (t.ch === 'K') { im = gx('yagura'); if (im) putSpr(im, x, y + R * 0.72, R * 2.1); }
}
// 地面と 自然は 変化が すくないので 1枚の 絵に まとめて おく
var terrCache = null;
function terrainKey() { var s = ''; for (var r = 0; r < G.map.h; r++) for (var c = 0; c < G.map.w; c++) s += G.map.tiles[r][c].ch; return s; }
function drawTerrainLayer() {
  var key = terrainKey();
  if (!terrCache || terrCache.map !== G.map || terrCache.key !== key) {
    var b = mapBounds(), sc = Math.min(1.5, 3000 / Math.max(b[0], b[1]));
    var cv = terrCache && terrCache.cv && terrCache.sc === sc ? terrCache.cv : document.createElement('canvas');
    cv.width = Math.ceil(b[0] * sc); cv.height = Math.ceil(b[1] * sc);
    var c2 = cv.getContext('2d'), keep = ctx; ctx = c2;
    try {
      ctx.setTransform(sc, 0, 0, sc, 0, 0); ctx.clearRect(0, 0, b[0], b[1]);
      var r, c;
      for (r = 0; r < G.map.h; r++) for (c = 0; c < G.map.w; c++) drawGround(G.map.tiles[r][c]);
      for (r = 0; r < G.map.h; r++) for (c = 0; c < G.map.w; c++) drawNature(G.map.tiles[r][c]);
      drawBorders();
    } finally { ctx = keep; }
    terrCache = { cv: cv, sc: sc, map: G.map, key: key, w: b[0], h: b[1] };
  }
  ctx.drawImage(terrCache.cv, 0, 0, terrCache.w, terrCache.h);
  for (var r2 = 0; r2 < G.map.h; r2++) for (var c3 = 0; c3 < G.map.w; c3++) { var t = G.map.tiles[r2][c3]; if (t.ch === 'W' || t.ch === 'G' || t.ch === 'K') drawCastlePart(t); }
}
// 国ざかい（点線）と となりの 国の 名前
function drawBorders() {
  if (!G.geoInfo) return;
  var r, c, d, acc = {};
  ctx.save(); ctx.setLineDash([6, 5]); ctx.strokeStyle = 'rgba(120,20,20,0.75)'; ctx.lineWidth = 2.5;
  for (r = 0; r < G.map.h; r++) for (c = 0; c < G.map.w; c++) {
    var t = G.map.tiles[r][c]; if (!t.prov) continue;
    if (t.prov !== G.geoInfo.to) { var a = acc[t.prov] || (acc[t.prov] = { x: 0, y: 0, n: 0 }); var p0 = hexCenter(c, r); a.x += p0[0]; a.y += p0[1]; a.n++; }
    var nb = neighbors(c, r);
    for (d = 0; d < 6; d++) {
      var o = tileAt(G, nb[d][0], nb[d][1]); if (!o || !o.prov || o.prov === t.prov || o.prov < t.prov) continue;
      var p1 = hexCenter(c, r), p2 = hexCenter(o.c, o.r), mx = (p1[0] + p2[0]) / 2, my = (p1[1] + p2[1]) / 2, vx = p2[0] - p1[0], vy = p2[1] - p1[1], L = Math.hypot(vx, vy);
      var hx = -vy / L * R * 0.5, hy = vx / L * R * 0.5;
      ctx.beginPath(); ctx.moveTo(mx - hx, my - hy); ctx.lineTo(mx + hx, my + hy); ctx.stroke();
    }
  }
  ctx.setLineDash([]);
  Object.keys(acc).forEach(function (k) {
    var a = acc[k]; if (a.n < 3) return; var nm = (G.geoInfo.names[k] || k);
    ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.fillStyle = 'rgba(110,20,20,0.9)';
    ctx.strokeText(nm, a.x / a.n, a.y / a.n); ctx.fillText(nm, a.x / a.n, a.y / a.n);
  });
  ctx.restore();
}
// 退き口（にげ口）の しるし
function drawExits() {
  if (!G.exits) return;
  ['atk', 'def'].forEach(function (side) {
    var mine = side === G.playerSide, groups = {};
    G.exits[side].forEach(function (e) {
      var p = hexCenter(e.c, e.r);
      hexPath(p[0], p[1], R - 4); ctx.fillStyle = mine ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.12)'; ctx.fill();
      ctx.setLineDash([4, 4]); ctx.strokeStyle = mine ? '#fff' : 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
      var g = groups[e.to] || (groups[e.to] = { x: 0, y: 0, n: 0, name: e.name }); g.x += p[0]; g.y += p[1]; g.n++;
    });
    // ちかい 退き口は 1まいの 札に まとめる
    var labs = [];
    Object.keys(groups).forEach(function (k) {
      var g = groups[k], x = g.x / g.n, y = g.y / g.n, m = null;
      labs.forEach(function (l) { if (Math.hypot(l.x - x, l.y - y) < R * 4) m = l; });
      if (m) m.names.push(g.name); else labs.push({ x: x, y: y, names: [g.name] });
    });
    labs.forEach(function (g) {
      var x = g.x, y = g.y, txt = (side === 'atk' ? '⬇' : '🏃') + g.names.join('・') + 'へ';
      ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      var w = ctx.measureText(txt).width + 12;
      ctx.fillStyle = side === G.playerSide ? 'rgba(30,90,200,0.85)' : 'rgba(170,40,30,0.8)';
      ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x - w / 2, y - 11, w, 22, 11); else ctx.rect(x - w / 2, y - 11, w, 22); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillText(txt, x, y + 1);
    });
  });
}
// 方位（北）
function drawCompass() {
  if (!G || G.north === undefined) return;
  var x = 46, y = ($('hud').offsetHeight || 56) + 46, a = G.north;
  ctx.save(); ctx.globalAlpha = 0.92;
  ctx.fillStyle = 'rgba(40,30,20,0.75)'; ctx.beginPath(); ctx.arc(x, y, 24, 0, Math.PI * 2); ctx.fill();
  ctx.translate(x, y); ctx.rotate(a + Math.PI / 2);
  ctx.fillStyle = '#e8463a'; ctx.beginPath(); ctx.moveTo(0, -19); ctx.lineTo(6, 0); ctx.lineTo(-6, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#eee'; ctx.beginPath(); ctx.moveTo(0, 19); ctx.lineTo(6, 0); ctx.lineTo(-6, 0); ctx.closePath(); ctx.fill();
  ctx.restore();
  var tx = x + Math.cos(a) * 34, ty = y + Math.sin(a) * 34;
  ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 4; ctx.strokeStyle = '#000'; ctx.fillStyle = '#fff';
  ctx.strokeText('北', tx, ty); ctx.fillText('北', tx, ty);
}
// 演出（矢・けむり・火花・土けむり）
var FX = [], FALLEN = [], STAMP = null;
function nowMs() { return (typeof performance !== 'undefined' ? performance.now() : Date.now()); }
function fxAdd(name, x, y, opt) { if (!gx(name)) return; opt = opt || {}; FX.push({ n: name, x: x, y: y, x2: opt.x2, y2: opt.y2, w: opt.w || R * 1.1, dur: opt.dur || 0.5, delay: opt.delay || 0, t: 0, rise: opt.rise || 0 }); }
function fxAttack(u, tc, tr, isWall) {
  var a = hexCenter(u.c, u.r), b = hexCenter(tc, tr);
  u._face = b[0] < a[0] - 1 ? -1 : b[0] > a[0] + 1 ? 1 : (u._face || 1);
  u._atk = nowMs() + ATK_MS;
  if (u.type === 'yumi') { fxAdd('arrow', a[0], a[1] - 18, { x2: b[0], y2: b[1] - 10, dur: 0.35, w: R * 0.9 }); }
  if (u.type === 'teppo') { fxAdd('smoke', a[0] + 16 * u._face, a[1] - 14, { dur: 0.9, w: R * 1.2, rise: 14 }); }
  if (isWall) { fxAdd('dust', b[0], b[1] - 8, { dur: 0.8, w: R * 1.3, delay: 0.1, rise: 10 }); fxAdd('crumble', b[0], b[1], { dur: 0.6, w: R * 1.1, delay: 0.15 }); }
  else fxAdd('spark', b[0], b[1] - 12, { dur: 0.45, w: R * 1.15, delay: u.type === 'yumi' ? 0.3 : 0.12 });
}
function fxFall(u) { FALLEN.push({ type: u.type, side: u.side, c: u.c, r: u.r, face: u._face || 1, t: 0 }); }
function stamp(name, sec) { if (gx(name)) STAMP = { n: name, t: 0, dur: sec || 1.5 }; }
function stepFx(dt) {
  FX.forEach(function (f) { if (f.delay > 0) f.delay -= dt; else f.t += dt / f.dur; }); FX = FX.filter(function (f) { return f.t < 1; });
  FALLEN.forEach(function (f) { f.t += dt / 1.3; }); FALLEN = FALLEN.filter(function (f) { return f.t < 1; });
  if (STAMP) { STAMP.t += dt / STAMP.dur; if (STAMP.t >= 1) STAMP = null; }
}
function drawFx() {
  FALLEN.forEach(function (f) {
    var im = unitSpr(f.type, 'down', f.side); if (!im) return;
    var p = hexCenter(f.c, f.r); ctx.globalAlpha = Math.min(1, (1 - f.t) * 2); putSprH(im, p[0], p[1] + R * 0.62, R * (f.type === 'kiba' ? 1.45 : 1.6), f.face < 0); ctx.globalAlpha = 1;
  });
  FX.forEach(function (f) {
    if (f.delay > 0) return; var im = gx(f.n), x = f.x, y = f.y - f.rise * f.t, h = f.w * im.naturalHeight / im.naturalWidth;
    ctx.save();
    if (f.x2 !== undefined) { x = f.x + (f.x2 - f.x) * f.t; y = f.y + (f.y2 - f.y) * f.t - Math.sin(f.t * Math.PI) * 18; ctx.translate(x, y); ctx.rotate(Math.atan2(f.y2 - f.y, f.x2 - f.x) + Math.PI * 0.08); ctx.drawImage(im, -f.w / 2, -h / 2, f.w, h); }
    else { ctx.globalAlpha = f.t < 0.7 ? 1 : (1 - f.t) / 0.3; var s = 0.8 + f.t * 0.4; ctx.translate(x, y); ctx.scale(s, s); ctx.drawImage(im, -f.w / 2, -h / 2, f.w, h); }
    ctx.restore();
  });
}
function drawStamp() {
  if (!STAMP) return; var im = gx(STAMP.n); if (!im) return;
  var t = STAMP.t, w = Math.min(W * 0.8, 520), h = w * im.naturalHeight / im.naturalWidth;
  var s = t < 0.15 ? 1.6 - t / 0.15 * 0.6 : 1, a = t < 0.15 ? t / 0.15 : t > 0.8 ? (1 - t) / 0.2 : 1;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(W / 2, H * 0.42); ctx.scale(s, s); ctx.drawImage(im, -w / 2, -h / 2, w, h); ctx.restore();
}
// 兵種ごとの 絵の 名前
var SPR_PRE = { ashigaru: 'ashi', kosaku: 'kosaku', teppo: 'teppo', kiba: 'kiba', yumi: 'yumi', taisho: 'taisho', ninja: 'ninja' };
function unitSpr(type, pose, side) { var p = SPR_PRE[type]; return p ? gx(p + '_' + pose + '_' + (side === G.playerSide ? 'b' : 'r')) : null; }
// 高さを そろえて おく
function putSprH(im, x, by, h, flip) { putSpr(im, x, by, h * im.naturalWidth / im.naturalHeight, flip); }
function drawAshigaru(u, x, y, col) {
  var now = nowMs(), pose = u._atk && u._atk > now ? 'atk' : 'stand', im = unitSpr(u.type, pose, u.side), anim = null;
  if (pose === 'atk') {   // 攻撃中は 4コマを じゅんに
    var fr = Math.min(4, Math.max(1, Math.floor((1 - (u._atk - now) / ATK_MS) * 4) + 1));
    anim = gx('anim_' + u.type + '_' + fr + '_' + (u.side === G.playerSide ? 'b' : 'r'));
  }
  if (!im && !anim) return false;
  var face = u._face || (u.side === G.playerSide ? 1 : -1);
  if (u.type === 'ninja' && !u.revealed) ctx.globalAlpha *= 0.6;   // かくれている 忍者は うすく
  ctx.fillStyle = col; ctx.globalAlpha *= 0.55; ctx.beginPath(); ctx.ellipse(x, y + R * 0.5, R * 0.55, R * 0.2, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha /= 0.55;
  ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(x, y + R * 0.5, R * 0.55, R * 0.2, 0, 0, Math.PI * 2); ctx.stroke();
  if (anim) putSprH(anim, x + 4 * face, y + R * 0.66, R * (u.type === 'kiba' ? 1.9 : u.type === 'taisho' ? 1.95 : 1.85), face < 0);
  else putSprH(im, x + (pose === 'atk' ? 6 * face : 0), y + R * 0.58, R * (u.type === 'kiba' ? 1.78 : 1.72), face < 0);
  return true;
}
function hpBar(x, y, f) {
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x - 22, y, 44, 6);
  ctx.fillStyle = f > 0.5 ? '#6fd36f' : f > 0.25 ? '#f0c040' : '#e85040'; ctx.fillRect(x - 21, y + 1, 42 * f, 4);
}
function sideColor(side) { return side === G.playerSide ? '#2f6fe0' : '#d9452f'; }
function drawUnit(u, x, y) {
  var col = sideColor(u.side);
  var rad = R * 0.52;
  ctx.save();
  if (u.acted && u.side === G.side) ctx.globalAlpha = 0.55;
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(x, y + rad * 0.85, rad * 0.9, rad * 0.35, 0, 0, Math.PI * 2); ctx.fill();
  if (u.type === 'taisho' && drawAshigaru(u, x, y, col)) {
    // 全身の 絵 ＋ だれが 大将かが わかる 小さな 顔
    var chB = charById(u.charId), imB = chB.spr ? getImg(chB.spr) : null, bx2 = x + R * 0.5, by2 = y - R * 0.95, br = R * 0.3;
    ctx.beginPath(); ctx.arc(bx2, by2, br + 2.5, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
    ctx.beginPath(); ctx.arc(bx2, by2, br, 0, Math.PI * 2); ctx.fillStyle = chB.spr ? '#fff6e0' : (chB.color || '#888'); ctx.fill();
    if (!chB.spr) { ctx.fillStyle = '#fff'; ctx.font = 'bold ' + Math.round(br * 1.2) + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(chB.crest || '将', bx2, by2 + 1); }
    else if (imB && imB.complete && imB.naturalWidth) {
      ctx.save(); ctx.beginPath(); ctx.arc(bx2, by2, br - 1, 0, Math.PI * 2); ctx.clip();
      if (chB.spr.indexOf('art:') === 0) ctx.drawImage(imB, bx2 - br, by2 - br, br * 2, br * 2);
      else { var scB = (br * 2.2) / imB.naturalHeight; ctx.drawImage(imB, bx2 - imB.naturalWidth * scB / 2, by2 - br + 1, imB.naturalWidth * scB, imB.naturalHeight * scB); }
      ctx.restore();
    }
  } else if (u.type === 'taisho') {
    var ch = charById(u.charId);
    ctx.beginPath(); ctx.arc(x, y, rad + 3, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fillStyle = '#fff6e0'; ctx.fill();
    var im = ch.spr ? getImg(ch.spr) : null;
    if (!ch.spr) {
      ctx.beginPath(); ctx.arc(x, y, rad - 2, 0, Math.PI * 2); ctx.fillStyle = ch.color || '#888'; ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold ' + Math.round(rad * 1.1) + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ch.crest || '将', x, y + 1);
    } else if (im && im.complete && im.naturalWidth) {
      ctx.save(); ctx.beginPath(); ctx.arc(x, y, rad - 1, 0, Math.PI * 2); ctx.clip();
      if (ch.spr.indexOf('art:') === 0) ctx.drawImage(im, x - rad, y - rad, rad * 2, rad * 2);
      else { var sc = (rad * 2.2) / im.naturalHeight, iw = im.naturalWidth * sc, ih = im.naturalHeight * sc; ctx.drawImage(im, x - iw / 2, y - rad + 2, iw, ih); }
      ctx.restore();
    }
  } else if (SPR_PRE[u.type] && drawAshigaru(u, x, y, col)) {
    // 絵で かいた
  } else {
    ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2.5; ctx.stroke();
    if (u.type === 'ninja') { ctx.setLineDash([4, 4]); ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, rad + 4, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
    ctx.fillStyle = '#fff'; ctx.font = 'bold ' + Math.round(rad * 1.15) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(UNIT_TYPES[u.type].ch, x, y + 1);
  }
  // 大将が ねらわれる位置なら あかい わく
  if (u.type === 'taisho' && u.side === G.playerSide && G.side === G.playerSide && threatAt(G, u.side, u.c, u.r, u) >= u.hp * 0.6) { ctx.globalAlpha = 1; ctx.strokeStyle = '#ff3030'; ctx.lineWidth = 3; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.arc(x, y, rad + 8, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
  // 未行動マーク
  if (u.side === G.playerSide && G.side === G.playerSide && !u.acted) { ctx.globalAlpha = 1; ctx.fillStyle = '#ffe24a'; ctx.beginPath(); ctx.arc(x - rad * 0.8, y - rad * 0.8, 6, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#7a5a00'; ctx.lineWidth = 1.5; ctx.stroke(); }
  // 兵数
  ctx.globalAlpha = 1;
  var mt = String(menOf(u)); ctx.font = 'bold 11px sans-serif';
  var bw = Math.max(18, ctx.measureText(mt).width + 8), bx = x + rad * 0.85 - bw / 2, by = y + rad * 0.8 - 8;
  ctx.fillStyle = u.hp <= 3 ? '#e85040' : '#222'; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(bx, by, bw, 16, 8); else ctx.rect(bx, by, bw, 16); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(mt, bx + bw / 2, by + 8.5);
  ctx.restore();
}
function render() {
  if (!G) return;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = '#6f8f5a'; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.translate(cam.x, cam.y); ctx.scale(cam.s, cam.s);
  if (gfxOn()) drawTerrainLayer();
  else { for (var r = 0; r < G.map.h; r++) for (var c = 0; c < G.map.w; c++) drawTile(G.map.tiles[r][c]); drawBorders(); }
  drawExits();
  // ハイライト
  if (reach && sel && phase === 'idle') {
    for (var k in reach) { if (k === '__from') continue; var p = k.split(',').map(Number); var hc = hexCenter(p[0], p[1]); hexPath(hc[0], hc[1], R - 3); ctx.fillStyle = 'rgba(40,110,255,0.42)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2.5; ctx.stroke(); }
  }
  targets.forEach(function (t) {
    var pos = t.unit ? [t.unit.c, t.unit.r] : [t.tile.c, t.tile.r]; var hc = hexCenter(pos[0], pos[1]);
    hexPath(hc[0], hc[1], R - 2);
    ctx.fillStyle = t.kind === 'attack' ? 'rgba(255,60,60,0.42)' : t.kind === 'wall' ? 'rgba(255,150,40,0.45)' : 'rgba(80,230,120,0.45)'; ctx.fill();
    if (t.from) ctx.setLineDash([7, 5]);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke(); ctx.setLineDash([]);
  });
  // ユニット
  G.units.forEach(function (u) {
    if (u.hp <= 0 || u.fled) return;
    if (moveAnim && moveAnim.unit === u) return;
    if (!isVisibleTo(G, u, G.playerSide)) return;
    var p = hexCenter(u.c, u.r); drawUnit(u, p[0], p[1]);
  });
  if (moveAnim) {
    var pa = moveAnim.path, tt = moveAnim.t * (pa.length - 1), i0 = Math.min(pa.length - 2, Math.floor(tt)), f = tt - i0;
    var a = hexCenter(pa[i0][0], pa[i0][1]), b = hexCenter(pa[i0 + 1][0], pa[i0 + 1][1]);
    var vis = isVisibleTo(G, moveAnim.unit, G.playerSide) || moveAnim.unit.side === G.playerSide;
    if (vis) drawUnit(moveAnim.unit, a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f - Math.sin(f * Math.PI) * 10);
  }
  drawFx();
  if (sel && phase !== 'cpu') { var sp = hexCenter(sel.c, sel.r); hexPath(sp[0], sp[1], R - 1); ctx.strokeStyle = '#ffe24a'; ctx.lineWidth = 4; ctx.stroke(); }
  // フロート
  anim.forEach(function (a) {
    var hc = hexCenter(a.c, a.r);
    ctx.globalAlpha = Math.max(0, 1 - a.t);
    ctx.font = 'bold ' + (a.big ? 30 : 24) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 5; ctx.strokeStyle = '#000'; ctx.fillStyle = a.col || '#fff';
    ctx.strokeText(a.text, hc[0], hc[1] - 20 - a.t * 40); ctx.fillText(a.text, hc[0], hc[1] - 20 - a.t * 40);
    ctx.globalAlpha = 1;
  });
  ctx.restore();
  drawCompass();
  drawStamp();
}
var lastT = 0;
function loop(ts) {
  var dt = Math.min(0.05, (ts - lastT) / 1000 || 0); lastT = ts;
  anim.forEach(function (a) { a.t += dt * 0.9; }); anim = anim.filter(function (a) { return a.t < 1; });
  stepFx(dt);
  if (moveAnim) { moveAnim.t += dt / Math.max(0.25, moveAnim.path.length * 0.12); if (moveAnim.t >= 1) { var cb = moveAnim.cb; moveAnim = null; if (cb) cb(); } }
  keepAbovePanel();
  render();
  requestAnimationFrame(loop);
}
function dmgMen(u, d) { return Math.max(1, Math.round(d * UNIT_TYPES[u.type].men / 10)); }
function floatText(c, r, text, col, big) { anim.push({ c: c, r: r, text: text, col: col, big: big, t: 0 }); }

// ---- HUD ----
var bSaveT = null;
function updateHud() {
  var mine = G.side === G.playerSide;
  // 国取りの 合戦は こまめに ほぞん（じぶんの ばんで うごきが おちついた とき）
  if (G.campaign && mine && typeof kSaveBattle === 'function') { clearTimeout(bSaveT); bSaveT = setTimeout(function () { if (G && G.campaign && G.side === G.playerSide && phase !== 'anim' && phase !== 'cpu' && !moveAnim) kSaveBattle(); }, 400); }
  if (G.food !== undefined) {
    var fdy = foodDays(G);
    var ddy = defFoodDays(G), mineA = G.playerSide === 'atk';
    $('turnLbl').innerHTML = (G.turn) + '日め　<span style="color:' + (fdy <= 3 ? '#ff6a5a' : fdy <= 6 ? '#ffc14a' : '#fff') + '">🍙' + (mineA ? 'みかた' : 'せめて') + ' ' + fdy + '日</span>' +
      (ddy !== null ? '　<span style="color:' + (ddy <= 3 ? '#ff6a5a' : ddy <= 6 ? '#ffc14a' : '#fff') + '">🏯' + (mineA ? '城' : 'みかたの城') + ' ' + (ddy > 99 ? '99+' : ddy) + '日</span>' : '');
  } else $('turnLbl').textContent = 'ターン ' + G.turn + ' / ' + G.turnLimit;
  $('sideLbl').textContent = mine ? 'あなたの ばん' : 'あいての ばん';
  $('sideLbl').className = mine ? 'me' : 'cpu';
  $('endTurnBtn').disabled = !mine || phase === 'cpu';
  var canRein = G.playerSide === 'def' && G.kBattle && typeof KS !== 'undefined' && KS && reinfSources(KS, G.kBattle).length > 0;
  $('reinBtn').style.display = canRein ? '' : 'none';
  if (canRein) $('reinBtn').disabled = !mine || phase === 'cpu';
  $('retreatBtn').disabled = !mine || phase === 'cpu' || G.over;
  var canRein = G.kBattle && typeof KS !== 'undefined' && KS && !G.over;
  $('reinBtn').style.display = canRein ? '' : 'none';
  if (canRein) $('reinBtn').disabled = !mine || phase === 'cpu';
  var canSup = G.food !== undefined && G.playerSide === 'atk' && G.kBattle && typeof KS !== 'undefined' && KS;
  $('supplyBtn').style.display = canSup ? '' : 'none';
  if (canSup) $('supplyBtn').disabled = !mine || phase === 'cpu' || !!activeConvoy(G, 'atk');
  var ca = unitsOf(G, 'atk').length, cd = unitsOf(G, 'def').length;
  $('countLbl').textContent = '⚔ せめて ' + ca + '　🏯 まもり ' + cd;
  updateInfo();
}
function unitName(u) { return u.type === 'taisho' ? generalName(u) + '（大将）' : UNIT_TYPES[u.type].name; }
function updateInfo() {
  var box = $('infoBox');
  var u = hoverInfo || sel;
  if (!u) {
    if (G.side === G.playerSide) {
      var n = unitsOf(G, G.playerSide).filter(function (x) { return !x.acted; }).length;
      var ub = undoStack.length ? '<button class="act undo" id="undoBtn">↩ もどす</button>' : '';
      if (n === 0) box.innerHTML = '<div class="nextrow"><p class="hint">ぜんぶ うごいた！</p>' + ub + '<button class="act" id="endBtn2">ターンおわり ▶</button></div>';
      else box.innerHTML = '<div class="nextrow"><p class="hint">じぶんの へいを クリック。のこり ' + n + 'たい</p>' + ub + '<button class="act" id="nextBtn">▶ つぎの へい</button></div>';
      if ($('nextBtn')) $('nextBtn').onclick = function () { SFX.tap(); nextUnit(); };
      if ($('endBtn2')) $('endBtn2').onclick = function () { SFX.tap(); playerEndTurn(); };
      if ($('undoBtn')) $('undoBtn').onclick = function () { SFX.tap(); undoLast(); };
    } else box.innerHTML = '<p class="hint">あいてが かんがえています…</p>';
    return;
  }
  var t = tileAt(G, u.c, u.r), T = UNIT_TYPES[u.type];
  var mine = u.side === G.playerSide;
  var html = '<div class="irow"><span class="uic ' + (mine ? 'blue' : 'red') + '">' + T.ch + '</span><b>' + unitName(u) + '</b><span class="tag">' + (mine ? 'みかた' : 'てき') + '</span></div>';
  html += '<div class="stats">兵 <b>' + menOf(u) + menUnit(u.type) + '</b>（' + UNIT_TYPES[u.type].men + menUnit(u.type) + 'の隊）／攻 ' + u.atk + '／守 ' + u.def + '／移 ' + u.mov + '／射 ' + (u.rmin === u.rmax ? u.rmin : u.rmin + '〜' + u.rmax) + '　地形：' + TERRAIN[t.ch].name + (t.ch === 'W' && !t.broken ? '（まもり UP）' : '') + '</div>';
  if (u.type === 'konida') html += '<p class="hint">🍙 兵糧 ' + Math.floor(u.cargo / Math.max(1, atkMen(G))) + '日ぶんを はこんでいる。本隊（みかた 3隊）の 2マス いないで とどく。</p>';
  if (mine && sel === u && G.side === G.playerSide) {
    if (phase === 'idle') html += '<p class="hint">あお＝いどう／あか・オレンジ＝こうげき／じぶんを もう一度＝まつ</p>';
    else if (phase === 'moved') html += '<p class="hint">あか＝こうげき／ほかを クリック＝まつ</p>';
  }
  box.innerHTML = html;
}
function banner(text, ms) {
  var b = $('banner'); b.textContent = text; b.classList.add('on');
  clearTimeout(banner.tm); banner.tm = setTimeout(function () { b.classList.remove('on'); }, ms || 1200);
}
var LOG = [];
function logMsg(s, who) {
  if (!G) return;
  var side = who || (G.side === G.playerSide ? 'me' : 'cpu');
  LOG.push({ turn: G.turn, side: side, text: s });
  if (LOG.length > 300) LOG.shift();
  renderLog();
}
function logHtml(e) { return '<div class="lg ' + e.side + '"><span class="lt">T' + e.turn + '</span>' + e.text + '</div>'; }
function renderLog() {
  var box = $('logLine'), last = LOG.slice(-3);
  box.innerHTML = last.length ? last.map(logHtml).join('') : '<div class="lg sys">ここに たたかいの きろくが でます</div>';
}
function openLog() {
  var b = $('logFull');
  b.innerHTML = LOG.length ? LOG.slice().reverse().map(logHtml).join('') : '<p>まだ きろくは ありません</p>';
  $('logBox').classList.add('on');
}

// ---- プレイヤー操作 ----
function computeTargets(u, moved) {
  var list = [];
  G.units.forEach(function (e) {
    if (e.hp <= 0 || e.side === u.side) return;
    if (!isVisibleTo(G, e, u.side)) return;
    if (canAttackFrom(G, u, u.c, u.r, e, moved)) list.push({ kind: 'attack', unit: e });
  });
  for (var r = 0; r < G.map.h; r++) for (var c = 0; c < G.map.w; c++) {
    var t = G.map.tiles[r][c];
    if (t.ch !== 'W' && t.ch !== 'G') continue;
    if (canHitWallFrom(G, u, u.c, u.r, t, moved)) list.push({ kind: 'wall', tile: t });
    else if (canOpenGateFrom(G, u, u.c, u.r, t)) list.push({ kind: 'open', tile: t });
    else if (canRepairFrom(G, u, u.c, u.r, t)) list.push({ kind: 'repair', tile: t });
    else if (canCloseGateFrom(G, u, u.c, u.r, t)) list.push({ kind: 'close', tile: t });
  }
  if (u.type === 'kosaku') neighbors(u.c, u.r).forEach(function (p) { var rt = tileAt(G, p[0], p[1]); if (canBuildBridgeFrom(G, u, u.c, u.r, rt)) list.push({ kind: 'bridge', tile: rt }); });
  return list;
}
// その兵が「うごいてから」できる行動を あつめる（クリック1回で 移動＋行動）
function targetsFrom(u, c, r, moved) {
  var oc = u.c, orr = u.r; u.c = c; u.r = r;
  var list = computeTargets(u, moved);
  u.c = oc; u.r = orr;
  return list;
}
function tgKey(t) { return t.kind + ':' + (t.unit ? 'u' + t.unit.id : t.tile.c + ',' + t.tile.r); }
function computeAllTargets(u) {
  var best = {};
  function consider(t, c, r, here) {
    var k = tgKey(t), pos = t.unit ? [t.unit.c, t.unit.r] : [t.tile.c, t.tile.r];
    var tile = tileAt(G, c, r), sc = here ? 3 : 0;
    sc += (1 - defMod(G, u, tile)) * 4;
    if (t.unit) { var d = hexDist(c, r, pos[0], pos[1]); if (!(d >= t.unit.rmin && d <= t.unit.rmax)) sc += 4; }
    sc -= (reach[key(c, r)] ? reach[key(c, r)].cost : 0) * 0.1;
    if (!best[k] || sc > best[k].sc) best[k] = { kind: t.kind, unit: t.unit, tile: t.tile, from: here ? null : [c, r], sc: sc };
  }
  computeTargets(u, false).forEach(function (t) { consider(t, u.c, u.r, true); });
  for (var k in reach) {
    if (k === '__from') continue;
    var p = k.split(',').map(Number);
    if (p[0] === u.c && p[1] === u.r) continue;
    targetsFrom(u, p[0], p[1], true).forEach(function (t) { consider(t, p[0], p[1], false); });
  }
  return Object.keys(best).map(function (k) { return best[k]; });
}
function showActions() {
  var bar = $('actBar'); bar.innerHTML = '';
  var kinds = {}; targets.forEach(function (t) { kinds[t.kind] = 1; });
  var labels = { attack: '⚔ あかい てきを クリックで こうげき', wall: '🔨 オレンジで かべこわし', open: '🚪 みどりで もんを あける', repair: '🔧 みどりで なおす', close: '🚪 みどりで もんを しめる', bridge: '🌉 みどりで はしを かける' };
  Object.keys(kinds).forEach(function (k) { var s = document.createElement('span'); s.className = 'actlbl'; s.textContent = labels[k]; bar.appendChild(s); });
  if (sel && canFlee(G, sel)) { var ex0 = exitAt(G, sel.side, sel.c, sel.r), fb = document.createElement('button'); fb.className = 'act flee'; fb.textContent = '🏃 にげる（' + ex0.name + 'へ）'; fb.onclick = function () { SFX.tap(); fleeUnit(); }; bar.appendChild(fb); }
  if (sel && sel.side === G.playerSide && !sel.acted) mergeTargets(G, sel).slice(0, 3).forEach(function (t) {
    var mb = document.createElement('button'); mb.className = 'act'; mb.textContent = '🔗 合流（' + menOf(t) + menUnit(t.type) + 'の 隊へ）';
    mb.onclick = function () { SFX.tap(); mergeUnit(t); }; bar.appendChild(mb); });
  var w = document.createElement('button'); w.className = 'act'; w.textContent = '⏸ まつ'; w.onclick = function () { SFX.tap(); finishUnit(); }; bar.appendChild(w);
  var nx = document.createElement('button'); nx.className = 'act sub'; nx.textContent = '▶ つぎ'; nx.onclick = function () { SFX.tap(); nextUnit(); }; bar.appendChild(nx);
  if (phase === 'moved' && undoPos && undoPos.unit === sel) { var ub = document.createElement('button'); ub.className = 'act undo'; ub.textContent = '↩ もどす'; ub.onclick = function () { SFX.tap(); undoMove(); }; bar.appendChild(ub); }
  if (phase === 'idle' && undoStack.length) { var ub2 = document.createElement('button'); ub2.className = 'act undo'; ub2.textContent = '↩ ひとつ前'; ub2.onclick = function () { SFX.tap(); undoLast(); }; bar.appendChild(ub2); }
  if (phase === 'idle') { var c = document.createElement('button'); c.className = 'act sub'; c.textContent = 'やめる'; c.onclick = function () { SFX.tap(); deselect(); }; bar.appendChild(c); }
  bar.classList.add('on');
}
// へった 隊を となりの おなじ 兵種の 隊に あわせる（もどせない）
function mergeUnit(t) {
  var u = sel; if (!u) return;
  var m0 = menOf(u), mv = doMerge(G, u, t); if (!mv) return;
  clearUndo(); SFX.repair && SFX.repair();
  floatText(t.c, t.r, '🔗+' + dmgMen(t, mv), '#bfe0ff', true);
  logMsg(unitName(u) + ' が となりの ' + unitName(t) + ' に 合流（' + dmgMen(t, mv) + menUnit(t.type) + '）' + (u.hp > 0 ? '　のこり ' + menOf(u) + menUnit(u.type) : ''));
  deselect(); updateHud(); afterPlayerAction();
}
// 全軍 撤退（たしかめてから）
function askRetreat() {
  if (!G || G.over || G.side !== G.playerSide || phase === 'cpu' || phase === 'anim' || moveAnim) return;
  var me = G.playerSide;
  if (!canRetreat(G, me)) { banner('にげ場が ない（籠城）ので 撤退 できない', 1500); return; }
  var msg = me === 'atk' ? '全軍で 撤退しますか？ 合戦は まけに なり、へいは もとの 城へ もどります（しんがりで 1わり ほど へる）。のこった 兵糧の 一部は てきに とられます。'
    : '城を すてて ' + G.exits.def[0].name + 'へ 撤退しますか？ 城は てきの ものに なり、へいは 1.5わり ほど へります。';
  confirmAct = function () { var r = retreatAll(G, me); if (!r) return; clearUndo(); deselect(); logMsg('🏳 ' + (me === 'atk' ? '全軍 撤退！' : G.exits.def[0].name + 'へ 撤退！') + '（しんがりで ' + r.lost + '人 うしなった）', 'sys'); updateHud(); gameOver(); };
  $('confirmMsg').textContent = msg; $('confirmYes').textContent = '🏳 撤退する'; $('confirmBox').classList.add('on');
}
var confirmAct = null;
function fleeUnit(ok) {
  var u = sel; if (!u || !canFlee(G, u)) return;
  if (u.type === 'taisho' && !ok) { confirmAct = function () { fleeUnit(true); }; $('confirmMsg').textContent = 'たいしょうが にげると この合戦は まけに なります。にげますか？'; $('confirmBox').classList.add('on'); return; }
  commitUndo(); var c = u.c, r = u.r, e = doFlee(G, u);
  floatText(c, r, e.name + 'へ', '#bfe0ff'); SFX.move();
  logMsg(unitName(u) + ' が ' + e.name + 'へ 退却した（' + menOf(u) + menUnit(u.type) + '）');
  deselect(); updateHud();
  if (checkVictory(G)) return gameOver();
}
// ---- ひとつ 前に もどす（移動・まつ・退却。こうげきなど 運の からむ 行動の あとは もどせない） ----
var undoStack = [], pendingSnap = null;
function snapUnits() {
  return { log: LOG.length, units: G.units.filter(function (u) { return u.side === G.playerSide; }).map(function (u) {
    return { u: u, c: u.c, r: u.r, moved: u.moved, acted: u.acted, fled: u.fled, fledTo: u.fledTo, fledName: u.fledName }; }) };
}
function commitUndo() { undoStack.push(pendingSnap || snapUnits()); pendingSnap = null; if (undoStack.length > 30) undoStack.shift(); }
function clearUndo() { undoStack = []; pendingSnap = null; }
function undoLast() {
  if (!G || G.over || G.side !== G.playerSide || phase === 'anim' || phase === 'cpu' || moveAnim) return;
  var sn = undoStack.pop(); if (!sn) return;
  sn.units.forEach(function (o) { var u = o.u; u.c = o.c; u.r = o.r; u.moved = o.moved; u.acted = o.acted; u.fled = o.fled; u.fledTo = o.fledTo; u.fledName = o.fledName; });
  LOG.length = Math.min(LOG.length, sn.log); if (typeof renderLog === 'function') renderLog();
  undoPos = null; sel = null; reach = null; targets = []; phase = 'idle'; hideActions(); hoverInfo = null;
  banner('ひとつ 前に もどした', 800); updateHud();
}
var undoPos = null;
function undoMove() {
  if (!undoPos || !sel || undoPos.unit !== sel || phase !== 'moved') return;
  var u = sel; u.c = undoPos.c; u.r = undoPos.r; u.moved = false; undoPos = null; pendingSnap = null;
  selectUnit(u);
}
function hideActions() { $('actBar').classList.remove('on'); $('actBar').innerHTML = ''; }
function deselect() { undoPos = null; sel = null; reach = null; targets = []; phase = 'idle'; hideActions(); updateInfo(); }
function selectUnit(u) {
  sel = u; reach = reachable(G, u); phase = 'idle';
  targets = computeAllTargets(u);
  showActions(); updateInfo();
}
function nextUnit() {
  if (!G || G.over || G.side !== G.playerSide || phase === 'anim' || phase === 'cpu' || moveAnim) return;
  if (phase === 'moved' && sel) { commitUndo(); sel.acted = true; deselect(); updateHud(); if (checkVictory(G)) return gameOver(); }
  var list = unitsOf(G, G.playerSide).filter(function (x) { return !x.acted && !x.moved; });
  if (!list.length) list = unitsOf(G, G.playerSide).filter(function (x) { return !x.acted; });
  if (!list.length) { afterPlayerAction(); return; }
  var i = sel ? (list.indexOf(sel) + 1) % list.length : 0;
  hoverInfo = null; selectUnit(list[i]); ensureVisible(list[i]);
}
function finishUnit() {
  if (sel) { commitUndo(); sel.acted = true; }
  deselect(); updateHud();
  afterPlayerAction();
}
function afterPlayerAction() {
  if (checkVictory(G)) { return gameOver(); }
  var left = unitsOf(G, G.playerSide).filter(function (u) { return !u.acted; });
  if (left.length === 0 && !undoStack.length) setTimeout(playerEndTurn, 350);
  else if (left.length === 0) updateInfo();
}
function performTarget(t) {
  var u = sel; if (!u) return;
  if (t.from && !(t.from[0] === u.c && t.from[1] === u.r)) {
    var path = pathTo(reach, t.from[0], t.from[1]);
    SFX.move(); hideActions(); targets = []; reach = null; phase = 'anim';
    moveAnim = { unit: u, path: path, t: 0, cb: function () {
      u.c = t.from[0]; u.r = t.from[1]; u.moved = true; undoPos = null;
      t.from = null; phase = 'moved'; performTarget(t);
    } };
    return;
  }
  phase = 'anim'; hideActions(); clearUndo();
  if (t.kind === 'attack') {
    var e = t.unit; fxAttack(u, e.c, e.r); var res = doAttack(G, u, e);
    if (res.killed) fxFall(e); if (res.counterKilled) fxFall(u);
    (u.type === 'teppo' ? SFX.gun : u.type === 'yumi' ? SFX.arrow : SFX.hit)();
    floatText(e.c, e.r, '-' + dmgMen(e, res.dmg), '#ffd24a', true);
    var msg = unitName(u) + ' の こうげき！ ' + unitName(e) + ' が ' + dmgMen(e, res.dmg) + menUnit(e.type) + ' うちとられた';
    if (res.killed) { msg += '　たおした！'; setTimeout(SFX.kill, 200); }
    else if (res.counter) { msg += '　はんげきで ' + dmgMen(u, res.counter) + menUnit(u.type) + ' うしなった'; setTimeout(function () { floatText(u.c, u.r, '-' + dmgMen(u, res.counter), '#ff8a8a'); SFX.hit(); }, 350); if (res.counterKilled) msg += '　やられた…'; }
    logMsg(msg);
  } else if (t.kind === 'wall') {
    fxAttack(u, t.tile.c, t.tile.r, true); var dmg = doHitWall(G, u, t.tile); SFX.wall(); floatText(t.tile.c, t.tile.r, '-' + dmg, '#ffb060', true);
    logMsg((t.tile.ch === 'G' ? 'もん' : 'じょうへき') + ' に ' + dmg + ' ダメージ' + (t.tile.broken ? '　こわした！' : '　（のこり ' + t.tile.hp + '）'));
  } else if (t.kind === 'open') { doOpenGate(G, u, t.tile); SFX.gate(); floatText(t.tile.c, t.tile.r, 'ひらいた！', '#a0ffb0'); logMsg('忍者が もんを あけた！'); }
  else if (t.kind === 'close') { doCloseGate(G, u, t.tile); SFX.gate(); floatText(t.tile.c, t.tile.r, 'しめた！', '#a0ffb0'); logMsg('もんを しめた！'); }
  else if (t.kind === 'bridge') { doBuildBridge(G, u, t.tile); SFX.repair(); floatText(t.tile.c, t.tile.r, 'はし！', '#a0ffb0'); logMsg('工作が 川に はしを かけた！'); }
  else if (t.kind === 'repair') { doRepair(G, u, t.tile); SFX.repair(); floatText(t.tile.c, t.tile.r, '+' + REPAIR_AMOUNT, '#a0ffb0'); logMsg('工作が ' + (t.tile.ch === 'G' ? 'もん' : 'じょうへき') + ' を なおした（' + t.tile.hp + '）'); }
  setTimeout(function () { u.acted = true; deselect(); updateHud(); afterPlayerAction(); }, 500);
}
function onTapHex(c, r, snapUnit) {
  if (!G || G.over) return;
  if (G.side !== G.playerSide || phase === 'cpu' || phase === 'anim' || moveAnim) return;
  var t = tileAt(G, c, r); if (!t) { if (phase === 'idle') deselect(); return; }
  var u = unitAt(G, c, r);
  if (u && !isVisibleTo(G, u, G.playerSide)) u = null;
  // ターゲット?
  if (sel && snapUnit) {
    for (var j = 0; j < targets.length; j++) if (targets[j].unit === snapUnit) { SFX.tap(); performTarget(targets[j]); return; }
  }
  if (sel) {
    for (var i = 0; i < targets.length; i++) {
      var tg = targets[i]; var pos = tg.unit ? [tg.unit.c, tg.unit.r] : [tg.tile.c, tg.tile.r];
      if (pos[0] === c && pos[1] === r) { SFX.tap(); performTarget(tg); return; }
    }
  }
  if (sel && phase === 'idle' && reach && reach[key(c, r)] && !(c === sel.c && r === sel.r)) {
    // 移動
    var path = pathTo(reach, c, r); var mv = sel; var from0 = [sel.c, sel.r]; pendingSnap = snapUnits();
    SFX.move(); hideActions(); targets = []; reach = null; phase = 'anim';
    moveAnim = { unit: mv, path: path, t: 0, cb: function () {
      mv.c = c; mv.r = r; mv.moved = true; undoPos = { unit: mv, c: from0[0], r: from0[1] };
      phase = 'moved'; targets = computeTargets(mv, true);
      // 本丸に乗ったら即勝利チェック（攻撃側）
      if (mv.side === 'atk' && tileAt(G, c, r).ch === 'K') { mv.acted = true; deselect(); updateHud(); checkVictory(G); gameOver(); return; }
      showActions(); updateInfo();
    } };
    return;
  }
  if (phase === 'moved') {
    // 移動したあと：ほかの場所を クリック ＝ その兵は「まつ」
    var cur = sel; commitUndo(); cur.acted = true; deselect(); updateHud();
    if (checkVictory(G)) return gameOver();
    if (u && u.side === G.playerSide && !u.acted && u !== cur) { SFX.tap(); selectUnit(u); return; }
    if (u && u !== cur) { hoverInfo = u; updateInfo(); }
    afterPlayerAction();
    return;
  }
  if (sel && phase === 'idle' && u === sel) {
    // えらんだ兵を もう一度 クリック ＝ その場で まつ
    SFX.tap(); finishUnit(); return;
  }
  if (u && u.side === G.playerSide) {
    if (u.acted) { hoverInfo = u; updateInfo(); banner('この へいは もう うごいた', 800); return; }
    SFX.tap(); hoverInfo = null; selectUnit(u); return;
  }
  if (u) { hoverInfo = u; deselectKeep(); updateInfo(); return; }
  deselect(); hoverInfo = null; updateInfo();
}
// クリックした点の ちかくに こうげきできる てきが いれば そちらを 優先（かべと まちがえにくく）
function nearestTargetUnit(wx, wy) {
  if (!sel || !targets.length) return null;
  var best = null, bd = R * 0.95;
  targets.forEach(function (t) { if (!t.unit) return; var p = hexCenter(t.unit.c, t.unit.r), d = Math.hypot(p[0] - wx, p[1] - wy); if (d < bd) { bd = d; best = t.unit; } });
  return best;
}
function deselectKeep() { sel = null; reach = null; targets = []; phase = 'idle'; hideActions(); }
// ---- 合戦の とちゅうで 援軍：まわりの 国の 地図から 城を えらぶ ----
var reinSel = null, reinSrcs = [];
function openRein() {
  if (!G || !G.kBattle || typeof KS === 'undefined' || !KS) return;
  var b = G.kBattle; reinSrcs = midSources(KS, b, G.playerSide); reinSel = null;
  drawReinMap(); reinListHtml(); $('reinPick').innerHTML = ''; $('reinGo').disabled = true;
  $('reinBox').classList.add('on');
}
function reinPos(o) {   // 国取り地図の 座標
  var w = worldMap(), ll = w.ll(o[0], o[1]); return kProj(ll[0], ll[1]);
}
function drawReinMap() {
  var cv = $('reinMap'), x = cv.getContext('2d'), b = G.kBattle, bh = branchHexes() || {};
  var tgt = b.castleId ? bh[b.castleId] : WORLD.castles[b.to], pts = [reinPos(tgt)].concat(reinSrcs.map(function (s0) { return reinPos(s0.hex); }));
  var x0 = Math.min.apply(null, pts.map(function (p) { return p[0]; })), x1 = Math.max.apply(null, pts.map(function (p) { return p[0]; }));
  var y0 = Math.min.apply(null, pts.map(function (p) { return p[1]; })), y1 = Math.max.apply(null, pts.map(function (p) { return p[1]; }));
  var mg = 30, wd = Math.max(80, x1 - x0) + mg * 2, ht = Math.max(56, y1 - y0) + mg * 2, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  if (wd / ht < cv.width / cv.height) wd = ht * cv.width / cv.height; else ht = wd * cv.height / cv.width;
  var sc = cv.width / wd, ox = cx - wd / 2, oy = cy - ht / 2;
  x.fillStyle = '#4f8fc6'; x.fillRect(0, 0, cv.width, cv.height);
  var hl = typeof kHexLayer === 'function' && kMap && kMap.HX ? kHexLayer() : null;
  if (hl) { var tr = kMap.terrRect, P = kMap.hexP; x.drawImage(hl, (ox - tr[0]) * P, (oy - tr[1]) * P, wd * P, ht * P, 0, 0, cv.width, cv.height); }
  function scr(p) { return [(p[0] - ox) * sc, (p[1] - oy) * sc]; }
  // 合戦の 城
  var tp = scr(pts[0]);
  x.font = 'bold 30px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.beginPath(); x.arc(tp[0], tp[1], 26, 0, Math.PI * 2); x.fillStyle = 'rgba(220,40,30,0.85)'; x.fill(); x.lineWidth = 4; x.strokeStyle = '#fff'; x.stroke(); x.fillStyle = '#fff'; x.fillText('⚔', tp[0], tp[1] + 2);
  x.font = 'bold 22px sans-serif'; x.lineWidth = 6; x.strokeStyle = '#fff'; x.strokeText(b.castleName || '', tp[0], tp[1] - 40); x.fillStyle = '#a01010'; x.fillText(b.castleName || '', tp[0], tp[1] - 40);
  // えらべる 城
  reinSrcs.forEach(function (s0, i) {
    var p = scr(reinPos(s0.hex)); s0.sp = p;
    x.beginPath(); x.moveTo(p[0], p[1]); x.lineTo(tp[0], tp[1]); x.setLineDash([10, 8]); x.lineWidth = 4; x.strokeStyle = i === reinSel ? '#ffe24a' : 'rgba(255,255,255,0.8)'; x.stroke(); x.setLineDash([]);
    var art = gx(castleArtOf(KS, s0.kind === 'branch' ? KS.castles[s0.src].prov : s0.src, s0.kind === 'branch' ? s0.src : null));
    x.beginPath(); x.arc(p[0], p[1], 30, 0, Math.PI * 2); x.fillStyle = i === reinSel ? 'rgba(255,226,74,0.9)' : 'rgba(255,255,255,0.85)'; x.fill(); x.lineWidth = 3; x.strokeStyle = '#2f6fe0'; x.stroke();
    if (art) { var aw = 54, ah = aw * art.naturalHeight / art.naturalWidth; x.drawImage(art, p[0] - aw / 2, p[1] + 16 - ah, aw, ah); }
    var lb = s0.name.replace(/（.*）/, '') + ' ' + s0.delay + '日';
    x.font = 'bold 20px sans-serif'; x.lineWidth = 6; x.strokeStyle = '#fff'; x.strokeText(lb, p[0], p[1] + 44); x.fillStyle = '#123'; x.fillText(lb, p[0], p[1] + 44);
  });
  if (!reinSrcs.length) { x.font = 'bold 24px sans-serif'; x.fillStyle = '#fff'; x.fillText('援軍を だせる 城が ない', cv.width / 2, cv.height - 30); }
}
function reinListHtml() {
  $('reinList').innerHTML = reinSrcs.map(function (s0, i) { return '<div class="kbrow" data-ri="' + i + '" style="cursor:pointer' + (i === reinSel ? ';background:rgba(255,226,74,.3)' : '') + '"><span class="kbrn">' + (s0.kind === 'branch' ? '🏰 ' : '🏯 ') + '<b>' + s0.name + '</b><br><small>' + menStr(menTotal(s0.units)) + '・' + s0.km + 'km・つくまで ' + s0.delay + '日</small></span></div>'; }).join('');
  [].forEach.call($('reinList').querySelectorAll('[data-ri]'), function (e) { e.onclick = function () { reinChoose(+e.dataset.ri); }; });
}
function reinChoose(i) {
  SFX.tap(); reinSel = i; var s0 = reinSrcs[i];
  $('reinPick').innerHTML = '<h4 style="margin:8px 0 2px">' + s0.name + 'から だす へい</h4>' + pickerHtml(s0.units, 0, 'mr_');
  pickerBind(function () { $('reinGo').disabled = !pickerUids(s0.units, 'mr_').length; }, $('reinPick'));
  $('reinGo').disabled = true; reinListHtml(); drawReinMap();
}
function reinGo() {
  var s0 = reinSrcs[reinSel]; if (!s0) return;
  var uids = pickerUids(s0.units, 'mr_'); if (!uids.length) return;
  var d = dispatchMid(KS, G.kBattle, G.playerSide, s0, uids); if (!d) return;
  var entry = reinfEntry(G, d.path, d.inTo);
  queueReinf(G, G.playerSide, d.list, entry, d.delay, s0.name.replace(/（.*）/, ''));
  if (kSave) kSave();
  $('reinBox').classList.remove('on');
  logMsg('🚩 ' + s0.name + 'から 援軍 ' + d.list.length + '隊（' + menStr(menTotal(d.list)) + '）が 出陣。' + d.delay + '日後に とうちゃく', 'sys');
  banner('🚩 援軍 出陣！ ' + d.delay + '日後に とうちゃく', 1400);
  floatText(entry.c, entry.r, '🚩', '#ffe24a', true); updateHud();
}
// 補給：国取りの お金で 小荷駄隊を よぶ
function supplyCost(days) { return Math.ceil(foodCost(atkMen(G), days) * 1.3); }   // はこぶ 手間で すこし たかい
function openSupply() {
  if (!G || G.food === undefined || activeConvoy(G, 'atk')) return;
  var gold = KS.clans[KS.player].gold, b0 = G.kBattle, home = b0 ? (b0.srcCastle || b0.from) : null, hpc = home ? locPC(KS, home) : null;
  if (home && locOwner(KS, home) !== KS.player) home = null;
  var store = home ? castleFood(KS, hpc[0], hpc[1]) : 0;
  $('supplyMsg').innerHTML = 'いまの 兵糧：あと <b>' + foodDays(G) + '日</b>（' + (home ? '🏯' + locName(KS, home) + 'の 蔵 ' + store.toLocaleString('ja-JP') + '石・' : '') + 'お金 💰' + kan(gold) + '）<br>兵糧は 出陣した 城の 蔵から。たりない ぶんは お金で かう。<br>攻め口に 小荷駄隊が あらわれる。<b>本隊（みかた 3隊いじょう）の 2マス いない</b>まで はこぶと 兵糧が ふえる。<br><span style="color:#b33">⚠ たたかえない。森・山・丘を みかたなしで すすむと 伏兵に おそわれやすい。てきにも ねらわれる。</span>';
  var box = $('supplyOpts'); box.innerHTML = '';
  [5, 10, 15].forEach(function (d) {
    var rp = ricePlan(KS, home ? [home] : [], atkMen(G) * d * RICE_PER_MAN), c = rp.gold, b = document.createElement('button'); b.className = 'act';
    b.innerHTML = d + '日ぶん<br><small>🍙' + rp.koku.toLocaleString('ja-JP') + '石' + (rp.short ? '・💰' + kan(c) : '（蔵から）') + '</small>'; b.disabled = c > gold;
    b.onclick = function () {
      SFX.tap(); $('supplyBox').classList.remove('on');
      if (KS.clans[KS.player].gold < rp.gold) return;
      var u = sendSupply(G, d, 'atk'); if (!u) return;
      applyRicePlan(KS, KS.player, rp);
      kSave && kSave();
      logMsg('🐴 小荷駄隊（兵糧 ' + d + '日ぶん）が 攻め口に ついた。本隊の そばまで はこぼう', 'sys'); banner('小荷駄隊が ついた', 1000);
      floatText(u.c, u.r, '🐴', '#ffe24a', true); updateHud();
    };
    box.appendChild(b);
  });
  $('supplyBox').classList.add('on');
}
// 小荷駄の できごと（おそわれた・とどいた）
function showNotes() {
  if (!G || !G.notes || !G.notes.length) return;
  G.notes.forEach(function (n, i) { logMsg(n.text, 'sys'); floatText(n.c, n.r, /とどいた/.test(n.text) ? '🍙+' : /援軍/.test(n.text) ? '🚩' : '⚔', /とどいた|援軍/.test(n.text) ? '#a0ffb0' : '#ff8a7a', true); setTimeout(function () { banner(n.text, 1300); }, 1000 + i * 1400); });
  G.notes = [];
}
// 兵糧の しらせ（のこり 5・3・1日）
function foodNote() {
  if (!G || G.food === undefined || G.side !== 'atk') return;
  var d = foodDays(G); if (d !== 5 && d !== 3 && d !== 1) return;
  var t = G.playerSide === 'atk' ? '🍙 兵糧が あと ' + d + '日ぶん！ いそいで 本丸へ' : '🍙 てきの 兵糧は あと ' + d + '日ぶん。もちこたえろ！';
  logMsg(t, 'sys'); setTimeout(function () { banner(t, 1300); }, 950);
}
function playerEndTurn() {
  if (!G || G.over || G.side !== G.playerSide) return;
  deselect(); hoverInfo = null; clearUndo();
  endTurn(G);
  if (G.over) return gameOver();
  updateHud(); SFX.turn(); banner('あいての ばん', 900); foodNote(); showNotes();
  logMsg('―― あいての ばん ――', 'sys');
  if (typeof kSaveBattle === 'function') kSaveBattle();
  setTimeout(cpuTurn, 700);
}

// ---- CPU ターン ----
function cpuTurn() {
  if (!G || G.over) return;
  phase = 'cpu'; updateHud();
  var order = aiOrder(G, G.cpuSide);
  var i = 0, myG = G;
  function next() {
    if (!G || G !== myG) return;   // べつの 合戦に かわった
    if (G.over) return gameOver();
    while (i < order.length && (order[i].hp <= 0 || order[i].acted || order[i].fled)) i++;
    if (i >= order.length) {
      // 本丸占領チェックを含む
      endTurn(G);
      if (G.over) return gameOver();
      phase = 'idle'; updateHud(); SFX.turn(); banner('あなたの ばん', 900); foodNote(); showNotes();
      if (typeof kSaveBattle === 'function') kSaveBattle();
      logMsg('―― ターン ' + G.turn + '　あなたの ばん ――', 'sys');
      return;
    }
    var u = order[i++];
    var plan = aiPlan(G, u);
    if (!plan) { u.acted = true; return next(); }
    var moved = plan.move[0] !== u.c || plan.move[1] !== u.r;
    var visBefore = isVisibleTo(G, u, G.playerSide);
    function act() {
      if (!G || G !== myG) return;
      var evs = aiExecute(G, u, plan);
      var delay = 120;
      evs.forEach(function (ev) {
        if (ev.kind === 'move') return;
        delay = 650;
        if (ev.kind === 'attack') {
          fxAttack(u, ev.target.c, ev.target.r); if (ev.res.killed) fxFall(ev.target); if (ev.res.counterKilled) fxFall(u);
          (u.type === 'teppo' ? SFX.gun : u.type === 'yumi' ? SFX.arrow : SFX.hit)();
          floatText(ev.target.c, ev.target.r, '-' + dmgMen(ev.target, ev.res.dmg), '#ff7070', true);
          var m = 'てきの ' + unitName(u) + ' が みかたの ' + unitName(ev.target) + ' を こうげき！ ' + dmgMen(ev.target, ev.res.dmg) + menUnit(ev.target.type) + ' うちとられた';
          if (ev.res.killed) { m += '　やられた…'; setTimeout(SFX.kill, 200); }
          else if (ev.res.counter) { m += '　はんげきで ' + dmgMen(u, ev.res.counter) + menUnit(u.type) + ' うちとった'; setTimeout(function () { floatText(u.c, u.r, '-' + dmgMen(u, ev.res.counter), '#ffd24a'); SFX.hit(); }, 350); if (ev.res.counterKilled) m += '　たおした！'; }
          logMsg(m);
        } else if (ev.kind === 'wall') { fxAttack(u, ev.tile.c, ev.tile.r, true); SFX.wall(); floatText(ev.tile.c, ev.tile.r, '-' + ev.dmg, '#ffb060', true); logMsg('てきが ' + (ev.tile.ch === 'G' ? 'もん' : 'じょうへき') + ' を こうげき！' + (ev.tile.broken ? ' こわされた！' : ' のこり ' + ev.tile.hp)); }
        else if (ev.kind === 'open') { SFX.gate(); floatText(ev.tile.c, ev.tile.r, 'ひらいた！', '#ffb0b0'); logMsg('てきの 忍者が もんを あけた！'); }
        else if (ev.kind === 'close') { SFX.gate(); floatText(ev.tile.c, ev.tile.r, 'しめた！', '#ffb0b0'); logMsg('てきが もんを しめた'); }
        else if (ev.kind === 'bridge') { SFX.repair(); floatText(ev.tile.c, ev.tile.r, 'はし！', '#ffb0b0'); logMsg('てきの 工作が 川に はしを かけた！'); }
        else if (ev.kind === 'flee') { SFX.move(); floatText(ev.c, ev.r, ev.exit.name + 'へ', '#ffd0d0'); logMsg('てきの ' + unitName(u) + ' が ' + ev.exit.name + 'へ 退却した'); }
        else if (ev.kind === 'repair') { SFX.repair(); floatText(ev.tile.c, ev.tile.r, '+' + REPAIR_AMOUNT, '#ffb0b0'); logMsg('てきの 工作が ' + (ev.tile.ch === 'G' ? 'もん' : 'じょうへき') + ' を なおした（のこり ' + ev.tile.hp + '）'); }
      });
      updateHud();
      if (checkVictory(G)) return gameOver();
      setTimeout(next, delay);
    }
    if (moved) {
      var reachU = reachable(G, u); var path = pathTo(reachU, plan.move[0], plan.move[1]);
      var tmpU = { c: plan.move[0], r: plan.move[1], side: u.side, type: u.type, revealed: u.revealed };
      var visAfter = isVisibleTo(G, tmpU, G.playerSide) || visBefore;
      if (!visAfter && !visBefore) { act(); return; }
      if (path.length < 2) { act(); return; }
      SFX.move();
      moveAnim = { unit: u, path: path, t: 0, cb: act };
    } else act();
  }
  next();
}

// ---- 終了 ----
function gameOver() {
  if (!G.over) return;
  if (G.campaign && typeof kSaveBattle === 'function') kSaveBattle();
  phase = 'cpu'; hideActions(); updateHud();
  var win = G.winner === G.playerSide;
  var ch = charById(G.chars[G.playerSide]);
  var box = $('resultBox');
  $('resultTitle').textContent = win ? 'しょうり！' : 'はいぼく…';
  $('resultTitle').className = win ? 'win' : 'lose';
  $('resultImg').src = SPR[(win ? ch.win : ch.lose) || 'fute_joy'];
  $('resultReason').textContent = G.reason + '（ターン ' + G.turn + '）';
  $('resultBtns').style.display = G.campaign ? 'none' : '';
  $('resultBtnsK').style.display = G.campaign ? '' : 'none';
  if (G.campaign) {
    var me = survivors(G, G.playerSide).length, en = survivors(G, G.cpuSide).length;
    $('resultReason').textContent += '　のこった へい：みかた ' + me + '／てき ' + en;
  }
  var showK = win && gx('kachidoki'); if (showK) setTimeout(function () { stamp('kachidoki', 1.6); }, 300);
  setTimeout(function () { box.classList.add('on'); (win ? SFX.win : SFX.lose)(); }, showK ? 1800 : 700);
}

// ---- 入力（タップ／ドラッグ／ピンチ） ----
// ---- ドラッグ・ピンチ（3つの 画面で 共通） ----
// opt: cam() → {x,y,s}, set(x,y,s), minS, maxS, tap(x,y), after()
function panZoom(cv, opt) {
  var ptrs = {}, mode = null, moved = false, base = null;
  function rel(e) { return evPt(e, cv); }
  // いまの 指の かずに あわせて 基準を とりなおす（指を はなした ときに とばないように）
  function rebase() {
    var ids = Object.keys(ptrs), c = opt.cam();
    if (ids.length === 1) { mode = 'drag'; base = { p: ptrs[ids[0]].slice(), x: c.x, y: c.y }; }
    else if (ids.length >= 2) {
      var a = ptrs[ids[0]], b = ptrs[ids[1]], mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      mode = 'pinch'; base = { d: Math.max(10, Math.hypot(a[0] - b[0], a[1] - b[1])), s: c.s, wx: (mid[0] - c.x) / c.s, wy: (mid[1] - c.y) / c.s };
    } else { mode = null; base = null; }
  }
  cv.addEventListener('pointerdown', function (e) {
    ptrs[e.pointerId] = rel(e);
    if (Object.keys(ptrs).length === 1) moved = false; else moved = true;
    rebase(); e.preventDefault();
  });
  cv.addEventListener('pointermove', function (e) {
    if (!ptrs[e.pointerId]) return; ptrs[e.pointerId] = rel(e);
    var ids = Object.keys(ptrs);
    if (mode === 'pinch' && ids.length >= 2) {
      var a = ptrs[ids[0]], b = ptrs[ids[1]], d = Math.hypot(a[0] - b[0], a[1] - b[1]), mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      var ns = Math.max(opt.minS, Math.min(opt.maxS, base.s * d / base.d));
      // さいしょに 指の まんなかに あった 場所が、いまの 指の まんなかに くるように
      opt.set(mid[0] - base.wx * ns, mid[1] - base.wy * ns, ns);
    } else if (mode === 'drag' && ids.length === 1) {
      var p = ptrs[ids[0]], dx = p[0] - base.p[0], dy = p[1] - base.p[1];
      if (!moved && Math.hypot(dx, dy) > 8) moved = true;
      if (moved) opt.set(base.x + dx, base.y + dy, opt.cam().s);
    }
    if (opt.after) opt.after();
  });
  function up(e) {
    if (!ptrs[e.pointerId]) return;
    var last = ptrs[e.pointerId]; delete ptrs[e.pointerId];
    var left = Object.keys(ptrs).length;
    if (left === 0) { if (!moved && opt.tap) opt.tap(last[0], last[1]); mode = null; base = null; }
    else rebase();   // のこった 指で つづけて ドラッグ
  }
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('wheel', function (e) {
    e.preventDefault(); var p = rel(e), c = opt.cam(), wx = (p[0] - c.x) / c.s, wy = (p[1] - c.y) / c.s;
    var ns = Math.max(opt.minS, Math.min(opt.maxS, c.s * (e.deltaY < 0 ? 1.1 : 0.9)));
    opt.set(p[0] - wx * ns, p[1] - wy * ns, ns); if (opt.after) opt.after();
  }, { passive: false });
  // iPhone の ページごと 拡大を とめる
  cv.addEventListener('gesturestart', function (e) { e.preventDefault(); });
}
function initInput() {
  panZoom(canvas, {
    cam: function () { return cam; }, minS: 0.15, maxS: 3,
    set: function (x, y, s) { cam.x = x; cam.y = y; cam.s = s; clampCam(); },
    tap: function (x, y) { var w = screenToWorld(x, y); var h = worldToHex(w[0], w[1]); onTapHex(h[0], h[1], nearestTargetUnit(w[0], w[1])); }
  });
}

// ---- 起動 ----
window.addEventListener('load', function () {
  canvas = $('cv'); ctx = canvas.getContext('2d');
  $('verLbl').textContent = VERSION;
  Array.prototype.forEach.call(document.querySelectorAll('.vlbl'), function (e) { e.textContent = VERSION; });
  $('startBtn').onclick = function () { SFX.tap(); bgmStart(); openModeBox(); };
  ['bgmBtn', 'bgmBtn2', 'bgmBtn3'].forEach(function (id) { var b = $(id); if (b) b.onclick = function (e) { e.stopPropagation(); audio(); bgmToggle(); }; });
  bgmLabel();
  // どこかを さわったら（iPhone の 音の ロック 解除）
  // iPhone は touchend / click の 中で ないと 音を ならせない
  ['touchend', 'click', 'pointerup', 'keydown'].forEach(function (ev) { document.addEventListener(ev, unlockAudio, { capture: true, passive: true }); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden && AC) audio(); });
  $('helpBtn').onclick = function () { SFX.tap(); $('helpBox').classList.add('on'); };
  $('helpBtn2').onclick = function () { SFX.tap(); $('helpBox').classList.add('on'); };
  $('helpClose').onclick = function () { SFX.tap(); $('helpBox').classList.remove('on'); };
  $('sideAtk').onclick = function () { SFX.tap(); setup.side = 'atk'; resetArmy(); renderSetup(); };
  $('sideDef').onclick = function () { SFX.tap(); setup.side = 'def'; resetArmy(); renderSetup(); };
  $('rerollBtn').onclick = function () { SFX.tap(); setup.mapSeed = 1 + Math.floor(Math.random() * 1e9); drawPreview(); };
  ['easy', 'normal', 'hard'].forEach(function (d) { $('dif_' + d).onclick = function () { SFX.tap(); setup.difficulty = d; renderSetup(); }; });
  $('goBtn').onclick = function () { SFX.tap(); startGame(); };
  $('backBtn').onclick = function () { SFX.tap(); show('title'); };
  $('endTurnBtn').onclick = function () {
    SFX.tap();
    if (!G || G.over || G.side !== G.playerSide || phase === 'cpu' || phase === 'anim' || moveAnim) return;
    var left = unitsOf(G, G.playerSide).filter(function (x) { return !x.acted && !x.moved; }).length;
    var gen = general(G, G.playerSide), danger = gen && threatAt(G, G.playerSide, gen.c, gen.r, gen) >= gen.hp * 0.6;
    var msgs = [];
    if (left > 0) msgs.push('まだ うごいていない へいが ' + left + 'たい います。');
    if (danger) msgs.push('⚠ 大将が てきの こうげきの とどく ところに います！');
    if (msgs.length) { $('confirmMsg').textContent = msgs.join(' ') + ' ターンを おわりますか？'; $('confirmBox').classList.add('on'); }
    else playerEndTurn();
  };
  $('confirmYes').onclick = function () { SFX.tap(); $('confirmBox').classList.remove('on'); $('confirmYes').textContent = 'おわる'; var f = confirmAct || playerEndTurn; confirmAct = null; f(); };
  $('supplyBtn').onclick = function () { SFX.tap(); openSupply(); };
  $('reinBtn').onclick = function () { SFX.tap(); openRein(); };
  $('retreatBtn').onclick = function () { SFX.tap(); askRetreat(); };
  $('reinNo').onclick = function () { SFX.tap(); $('reinBox').classList.remove('on'); };
  $('reinGo').onclick = function () { SFX.tap(); reinGo(); };
  $('reinMap').onclick = function (e) {
    var cv = $('reinMap'), ep = evPt(e, cv), mx = ep[0] * cv.width / (cv.offsetWidth || 1), my = ep[1] * cv.height / (cv.offsetHeight || 1), bi = -1, bd = 1e9;
    reinSrcs.forEach(function (s0, i) { if (!s0.sp) return; var d = Math.hypot(s0.sp[0] - mx, s0.sp[1] - my); if (d < bd) { bd = d; bi = i; } });
    if (bi >= 0 && bd < 70) reinChoose(bi);
  };
  $('supplyNo').onclick = function () { SFX.tap(); $('supplyBox').classList.remove('on'); };
  $('confirmNo').onclick = function () { SFX.tap(); confirmAct = null; $('confirmYes').textContent = 'おわる'; $('confirmBox').classList.remove('on'); };
  $('logLine').onclick = function () { SFX.tap(); openLog(); };
  $('logClose').onclick = function () { SFX.tap(); $('logBox').classList.remove('on'); };
  $('fitBtn').onclick = function () { SFX.tap(); toggleCamera(); };
  $('quitBtn').onclick = function () {
    SFX.tap();
    if (G && G.campaign) {
      if (G.over) return;
      if (confirm('ひきあげますか？（この 合戦は まけに なります）')) { G.over = true; G.winner = G.cpuSide; G.reason = 'ひきあげた'; gameOver(); }
      return;
    }
    if (confirm('タイトルに もどりますか？')) { G = null; show('title'); }
  };
  $('againBtn').onclick = function () { SFX.tap(); $('resultBox').classList.remove('on'); startGame(); };
  $('toTitleBtn').onclick = function () { SFX.tap(); $('resultBox').classList.remove('on'); G = null; show('title'); };
  $('toSetupBtn').onclick = function () { SFX.tap(); $('resultBox').classList.remove('on'); G = null; show('setupScreen'); renderSetup(); };
  initInput();
  kInit();
  window.addEventListener('resize', function () { if (G) { resize(); fitCamera(); } });
  requestAnimationFrame(loop);
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(function () {});
});
