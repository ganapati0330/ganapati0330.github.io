import json,sys
from PIL import Image, ImageDraw
d=json.load(open('/tmp/world_dbg.json')); W,H=d['w'],d['h']
S=4
im=Image.new('RGB',(W*S+S,H*S),(255,255,255)); dr=ImageDraw.Draw(im)
COL={'s':(90,150,210),'X':(200,190,170),'M':(70,50,40),'m':(140,110,80),'h':(190,180,110),'f':(70,130,70),'.':(170,210,140),'r':(40,100,230),'=':(230,200,90)}
for r in range(H):
  for c in range(W):
    t=d['T'][r*W+c]; x=c*S+(S//2 if r&1 else 0)
    col=COL.get(t,(255,0,255))
    p=d['prov'][r*W+c]
    dr.rectangle([x,r*S,x+S-1,r*S+S-1],fill=col)
# prov borders
for r in range(H):
  for c in range(W-1):
    if d['prov'][r*W+c]!=d['prov'][r*W+c+1] and d['prov'][r*W+c] not in '~_' and d['prov'][r*W+c+1] not in '~_':
      x=c*S+(S//2 if r&1 else 0)+S; dr.rectangle([x-1,r*S,x,r*S+S-1],fill=(200,0,0))
for k,(c,r) in d['cas'].items():
  x=c*S+(S//2 if r&1 else 0); dr.ellipse([x-6,r*S-6,x+6,r*S+6],fill=(255,0,0),outline=(0,0,0)); dr.text((x+8,r*S-6),k,fill=(0,0,0))
im.save(sys.argv[1] if len(sys.argv)>1 else '/tmp/world.png')
print(W,H)
