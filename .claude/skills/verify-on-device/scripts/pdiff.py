#!/usr/bin/env python3
import sys
# pdiff.py a.png b.png [top px]: bounding box of what changed between two screenshots (below the status bar)
from PIL import Image, ImageChops
a=Image.open(sys.argv[1]).convert('RGB'); b=Image.open(sys.argv[2]).convert('RGB')
if a.size!=b.size: print('size', a.size, b.size); sys.exit()
top=int(sys.argv[3]) if len(sys.argv)>3 else 160
d=ImageChops.difference(a,b).convert('L').crop((0,top,a.size[0],a.size[1]))
bb=d.point(lambda v:255 if v>24 else 0).getbbox()
print('bbox', bb)
