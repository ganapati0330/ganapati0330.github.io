# 北奥羽の 境界データ（geo.json / geo.js）を つくる
#  出典：国土数値情報（行政区域データ）国土交通省（niiyz/JapanCityGeoJson 2020 版）を 加工
#  市町村を 領地に まとめ、2つに わける 市（弘前・青森）は 城の 位置の ボロノイで わける
import json, sys, os
from shapely.geometry import shape, Polygon, MultiPolygon, Point, box, mapping
from shapely.ops import unary_union, voronoi_diagram, polylabel
from shapely.geometry import MultiPoint

SRC = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/geodl/jcg/geojson'
OUT = os.path.dirname(os.path.abspath(__file__))
BBOX = box(139.55, 39.42, 142.12, 41.66)

# 元データは 島の 多い 市で、島ごとの 輪郭が 1つの 多角形の「穴」として 入っている。
# 輪郭を すべて 別々の 陸地として よみなおす（本当の 穴は ほぼ ないので 問題ない）
def rings2land(geom):
    polys = []
    def add(coords):
        for ring in coords:
            if len(ring) >= 4:
                p = Polygon(ring)
                if abs(p.area) > 2e-6: polys.append(p.buffer(0))
    if geom['type'] == 'Polygon': add(geom['coordinates'])
    elif geom['type'] == 'MultiPolygon':
        for pc in geom['coordinates']: add(pc)
    return unary_union(polys)
def load(code):
    g = json.load(open(os.path.join(SRC, code[:2], code + '.json')))
    return unary_union([rings2land(f['geometry']) for f in g['features']])

PROVS = {
  'oura':      ['02343', '02321', '02323', ('02202', 'a')],
  'ishikawa':  ['02362', ('02202', 'b')],
  'daikoji':   ['02210', '02204', '02367', '02361'],
  'namioka':   [('02201', 'a')],
  'iizume':    ['02205', '02209', '02381', '02384', '02387'],
  'sotogahama':['02304', '02307', '02303', '02301', ('02201', 'b')],
  'tanabu':    ['02208', '02423', '02424', '02425', '02426'],
  'shichinohe':['02402', '02408', '02401', '02406', '02411'],
  'gonohe':    ['02442', '02206', '02450'],
  'hachinohe': ['02203', '02446', '02412', '02207', '02405'],
  'sannohe':   ['02441', '02445', '02443'],
  'kunohe':    ['03213', '03524', '03501', '03506', '03207', '03507', '03503', '03485'],
  'iwate':     ['03201', '03216', '03214', '03301', '03303', '03302'],
  'shiwa':     ['03321', '03322'],
  'hei':       ['03202', '03483', '03484', '03482'],
  'kazuno':    ['05209', '05303'],
  'hinai':     ['05204', '05213'],
  'hiyama':    ['05202', '05349', '05346', '05348'],
  'minato':    ['05201', '05206', '05211', '05361', '05363', '05366', '05327']
}
# 2つに わける 市：[ [わける 先, 種の 経度・緯度], ... ]
SPLIT = {
  '02202': [('a', (140.33, 40.63)), ('b', (140.50, 40.57))],   # 弘前：西（大浦・岩木）／南東（石川）
  '02201': [('a', (140.585, 40.70)), ('b', (140.76, 40.83))]   # 青森：浪岡／外ヶ浜
}
NEAR = {
  '渡島（蝦夷地）': ['01202', '01236', '01331', '01332', '01333', '01334', '01337', '01343', '01345', '01361', '01362'],
  '仙北': ['05215', '05212', '05434'],
  '由利': ['05210'],
  '稗貫・和賀': ['03205', '03366', '03206'],
  '遠野・釜石': ['03208', '03211', '03461']
}
splitCache = {}
def splitPart(code, part):
    if code not in splitCache:
        g = load(code)
        seeds = SPLIT[code]
        vor = voronoi_diagram(MultiPoint([Point(*s[1]) for s in seeds]), envelope=box(138, 38, 144, 43))
        parts = {}
        for cell in vor.geoms:
            for k, s in seeds:
                if cell.contains(Point(*s)): parts[k] = g.intersection(cell)
        splitCache[code] = parts
    return splitCache[code][part]

def clean(geom, minA=4e-5):
    geom = geom.intersection(BBOX)
    polys = [geom] if isinstance(geom, Polygon) else [p for p in getattr(geom, 'geoms', []) if isinstance(p, Polygon)]
    out = []
    for p in polys:
        q = Polygon(p.exterior).simplify(0.0025, preserve_topology=True)
        if q.area >= minA: out.append(q)
    return out

def enc(poly):
    pts = [(round(x * 1000), round(y * 1000)) for x, y in list(poly.exterior.coords)[:-1]]
    s, px, py = [], 0, 0
    for x, y in pts:
        s += [x - px, y - py]; px, py = x, y
    return ','.join(str(v) for v in s)

geoms = {}
for pid, lst in PROVS.items():
    parts = [splitPart(c[0], c[1]) if isinstance(c, tuple) else load(c) for c in lst]
    geoms[pid] = unary_union(parts).buffer(0)
# 八郎潟（大潟村は 戦国時代には 湖）
hachiro = load('05368').buffer(0.006)
geoms['minato'] = geoms['minato'].difference(hachiro)

out = {'provs': {}, 'labels': {}, 'adj': {}, 'near': []}
for pid, g in geoms.items():
    ps = clean(g)
    ps.sort(key=lambda p: -p.area)
    out['provs'][pid] = [enc(p) for p in ps]
    lab = polylabel(ps[0], tolerance=0.002)
    out['labels'][pid] = [round(lab.x, 3), round(lab.y, 3)]
ids = list(geoms)
for a in ids:
    out['adj'][a] = []
for i, a in enumerate(ids):
    for b in ids[i + 1:]:
        inter = geoms[a].buffer(0.003).intersection(geoms[b].buffer(0.003))
        if inter.area > 0.003 * 0.006:     # ざっくり 1km いじょう 接する
            out['adj'][a].append(b); out['adj'][b].append(a)
for name, codes in NEAR.items():
    g = unary_union([load(c) for c in codes])
    ps = clean(g, 1e-4)
    if ps: out['near'].append({'name': name, 'rings': [enc(p) for p in ps]})
json.dump(out, open(os.path.join(OUT, 'geo.json'), 'w'), ensure_ascii=False)
js = '/* 北奥羽の 国境データ（出典：国土数値情報（行政区域データ）国土交通省 を 加工・簡略化） */\nvar CHUGOKU_GEO = ' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n'
open(os.path.join(OUT, 'geo.js'), 'w').write(js)
for a in ids: print(a, len(out['provs'][a]), 'rings', out['labels'][a], out['adj'][a])
print('geo.js', len(js))
