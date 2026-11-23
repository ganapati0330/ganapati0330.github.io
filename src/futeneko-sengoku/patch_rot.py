# スマホ縦持ちでも 横長で 表示する（画面ぜんたいを 90度 まわす）修正を、ソースフォルダに あてる
# つかいかた：python3 patch_rot.py <src フォルダ> <新しい バージョン>
import re, sys, os
D, VER = sys.argv[1], sys.argv[2]
def rd(f): return open(os.path.join(D, f), encoding='utf-8').read()
def wr(f, s): open(os.path.join(D, f), 'w', encoding='utf-8').write(s)

ROT_JS = r"""
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
  [['mw420', lw <= 420], ['mw480', lw <= 480], ['mw520', lw <= 520], ['mh520', lh <= 520]].forEach(function (c) { b.classList.toggle(c[0], c[1]); });
}
// ポインタの 位置を その 要素の 中の 座標（論理）に する
function evPt(e, el) { var rc = el.getBoundingClientRect(); return ROT ? [e.clientY - rc.top, rc.right - e.clientX] : [e.clientX - rc.left, e.clientY - rc.top]; }
window.addEventListener('resize', applyRot);
window.addEventListener('orientationchange', function () { setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 350); });
document.addEventListener('DOMContentLoaded', applyRot);
applyRot();
"""

ui = rd('ui.js')
if 'function applyRot()' not in ui:
    i = ui.index('\n', ui.index("'use strict';")) + 1
    ui = ui[:i] + ROT_JS + ui[i:]
ui = ui.replace("function rel(e) { var rc = cv.getBoundingClientRect(); return [e.clientX - rc.left, e.clientY - rc.top]; }",
                "function rel(e) { return evPt(e, cv); }")
ui = ui.replace("var cv = $('reinMap'), rc = cv.getBoundingClientRect(), mx = (e.clientX - rc.left) * cv.width / rc.width, my = (e.clientY - rc.top) * cv.height / rc.height,",
                "var cv = $('reinMap'), ep = evPt(e, cv), mx = ep[0] * cv.width / (cv.offsetWidth || 1), my = ep[1] * cv.height / (cv.offsetHeight || 1),")
assert ui.count('e.clientX') == 2, 'ui.js にまだ clientX'
wr('ui.js', ui)

k = rd('kuni.js')
k = k.replace("var rc = kcv.getBoundingClientRect(), wx = (e.clientX - rc.left - kMap.x) / kMap.s, wy = (e.clientY - rc.top - kMap.y) / kMap.s;",
              "var ep = evPt(e, kcv), wx = (ep[0] - kMap.x) / kMap.s, wy = (ep[1] - kMap.y) / kMap.s;")
k = k.replace("var rc = cv.getBoundingClientRect(), h = domCastleAt(e.clientX - rc.left, e.clientY - rc.top), k = h ? h.key : null;",
              "var ep = evPt(e, cv), h = domCastleAt(ep[0], ep[1]), k = h ? h.key : null;")
assert 'e.clientX' not in k, 'kuni.js にまだ clientX'
wr('kuni.js', k)

t = rd('template.html')
# @media（はば・高さ）→ body の クラス（まわした あとの はば・高さで JS が つける）
def media(m):
    kind, n, body = m.group(1), m.group(2), m.group(3)
    cls = ('body.mw' if kind == 'width' else 'body.mh') + n
    out = []
    for rule in re.finditer(r'([^{}]+)\{([^{}]*)\}', body):
        sels = ', '.join(cls + ' ' + s.strip() for s in rule.group(1).split(','))
        out.append(sels + '{' + rule.group(2) + '}')
    return ''.join(out)
t = re.sub(r'@media \(max-(width|height):(\d+)px\)\{((?:[^{}]*\{[^{}]*\})*)\s*\}', media, t)
assert '@media (max-' not in t, 'のこった @media'
# vh・vw → まわした あとの 大きさ
t = re.sub(r'(\d+(?:\.\d+)?)d?v([hw])\b', lambda m: 'calc(var(--v%s,1v%s)*%s)' % (m.group(2), m.group(2), m.group(1)), t)
t = t.replace('touch-action:pan-y', 'touch-action:var(--pan,pan-y)')
if 'body.rot{' not in t:
    t = t.replace('</style>', 'body.rot{position:fixed;top:0;left:0;transform-origin:0 0;--pan:pan-x pan-y;}\n</style>', 1)
wr('template.html', t)

g = rd('game.js')
g = re.sub(r"var VERSION = 'v[0-9.]+'", "var VERSION = '%s'" % VER, g)
wr('game.js', g)
print('patched', D, VER)

# ---- 横長で 低い 画面（スマホ横持ち）では、国取り・領内の 情報パネルを 右がわに おく ----
ui = rd('ui.js')
ui = ui.replace("[['mw420', lw <= 420], ['mw480', lw <= 480], ['mw520', lw <= 520], ['mh520', lh <= 520]]",
                "[['mw420', lw <= 420], ['mw480', lw <= 480], ['mw520', lw <= 520], ['mh520', lh <= 520], ['side', lh <= 520 && lw >= lh * 1.3]]")
if 'function hudWatch' not in ui:
    ui = ui.replace("document.addEventListener('DOMContentLoaded', applyRot);",
"""// 上の バーの 高さを CSS に つたえる（右がわの パネルを その 下から はじめる）
function hudWatch() {
  [['khud', '--khudH'], ['dhud', '--dhudH']].forEach(function (a) {
    var el = document.getElementById(a[0]); if (!el) return;
    var set = function () { if (el.offsetHeight) document.documentElement.style.setProperty(a[1], el.offsetHeight + 'px'); };
    if (window.ResizeObserver) new ResizeObserver(set).observe(el);
    window.addEventListener('resize', set); set();
  });
}
document.addEventListener('DOMContentLoaded', function () { applyRot(); hudWatch(); });""")
wr('ui.js', ui)
k = rd('kuni.js')
k = k.replace("function kAvail() { var top = ($('khud').offsetHeight || 60) + 4, bot = ($('kbottom').offsetHeight || 120) + 4;",
              "function kAvail() { var top = ($('khud').offsetHeight || 60) + 4, bot = document.body.classList.contains('side') ? 4 : ($('kbottom').offsetHeight || 120) + 4;")
k = k.replace("$('kLegend').style.bottom = (($('kbottom').offsetHeight || 150) + 6) + 'px';",
              "$('kLegend').style.bottom = (document.body.classList.contains('side') ? 6 : ($('kbottom').offsetHeight || 150) + 6) + 'px';")
k = k.replace("function domArea() { var top = ($('dhud').offsetHeight || 50) + 4, bot = ($('dbottom').offsetHeight || 150) + 4;",
              "function domArea() { var top = ($('dhud').offsetHeight || 50) + 4, bot = document.body.classList.contains('side') ? 4 : ($('dbottom').offsetHeight || 150) + 4;")
assert k.count("classList.contains('side')") == 3, 'side の 置きかえ'
wr('kuni.js', k)
t = rd('template.html')
if 'body.side #kbottom' not in t:
    t = t.replace('</style>', """body.side #kcv,body.side #dcv{width:58%;}
body.side #kbottom{left:auto;width:42%;top:var(--khudH,56px);overflow-y:auto;box-sizing:border-box;touch-action:var(--pan,pan-y);}
body.side #dbottom{left:auto;width:42%;top:var(--dhudH,50px);overflow-y:auto;box-sizing:border-box;touch-action:var(--pan,pan-y);}
body.side #kbottom{display:flex;flex-direction:column;}
body.side #kActs{order:-1;margin:0 0 6px;}
body.side #kbottom>*{flex-shrink:0;}
body.side #dbottom{display:flex;flex-direction:column;}body.side #dActs{order:-1;margin:0 0 6px;}body.side #dbottom>*{flex-shrink:0;}
</style>""", 1)
wr('template.html', t)
print('side ok')
