import re, json, base64, os, sys
d = os.path.dirname(os.path.abspath(__file__))
def rd(n): return open(os.path.join(d, n), encoding='utf-8').read()
spr = rd('spr.js')
sprd = json.loads(spr[len('const SPR='):].rstrip().rstrip(';'))
game = rd('game.js').replace("'use strict';", '', 1)
ui = rd('ui.js').replace("'use strict';", '', 1)
camp = re.sub(r"if \(typeof module !== 'undefined'\) \{.*", '', rd('campaign.js').replace("'use strict';", '', 1), flags=re.S)
kuni = rd('lordart.js') + rd('kuni.js').replace("'use strict';", '', 1)
evs = re.sub(r"if \(typeof module !== 'undefined'\).*", '', rd('events.js').replace("'use strict';", '', 1), flags=re.S)
# module.exports ブロックを除去
game = re.sub(r"if \(typeof module !== 'undefined'\) \{.*?\n\}\n", '', game, flags=re.S)
html = rd('template.html')
html = html.replace('__MENU__', 'data:image/webp;base64,' + base64.b64encode(open(os.path.join(d,'menu.webp'),'rb').read()).decode())
html = html.replace('__SPR__', "'use strict';\n" + spr).replace('__GAME__', game + '\n' + rd('geo.js') + '\n' + rd('world.js') + '\n' + camp + '\n' + evs).replace('__UI__', ui + '\n' + kuni)
ver = re.search(r"var VERSION = '(v[\d.]+)'", game).group(1)
out = os.path.join(d, 'dist'); os.makedirs(out, exist_ok=True)
open(os.path.join(out, 'index.html'), 'w', encoding='utf-8').write(html)
sw = ("const CACHE='futeneko-sengoku-%s';\n" % ver +
"self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./','./index.html','./bgm.mp3'])).then(()=>self.skipWaiting()));});\n"
"self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('futeneko-sengoku-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});\n"
"self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));return r;}).catch(()=>caches.match(e.request)));});\n")
open(os.path.join(out, 'sw.js'), 'w').write(sw)
import shutil
imgd = os.path.join(out, 'img'); os.makedirs(imgd, exist_ok=True)
for f in os.listdir(os.path.join(d, 'gfx')):
    if f.endswith('.webp'): shutil.copy(os.path.join(d, 'gfx', f), os.path.join(imgd, f))
print('built', ver, len(html))
