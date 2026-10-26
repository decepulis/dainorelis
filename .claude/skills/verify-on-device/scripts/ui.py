#!/usr/bin/env python3
import sys,json
# ui.py: axe describe-ui --udid <udid> | python3 ui.py  -> controls with labels, centers and sizes
d=json.loads(sys.stdin.read())
def walk(n):
  if isinstance(n,list):
    for c in n: walk(c); return
  lab=(n.get('AXLabel') or '').replace('\n',' ')[:40]
  t=n.get('type') or ''
  f=n.get('frame') or {}
  if t not in ('StaticText','Application','Group','Other','ScrollView','Window') or (t=='Other' and lab):
    print(f"{t} '{lab}' center=({f.get('x',0)+f.get('width',0)/2:.0f},{f.get('y',0)+f.get('height',0)/2:.0f}) {f.get('width',0):.0f}x{f.get('height',0):.0f}")
  for c in n.get('children',[]) or []: walk(c)
walk(d)
