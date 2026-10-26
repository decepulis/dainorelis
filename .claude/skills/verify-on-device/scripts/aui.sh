#!/bin/zsh
# aui.sh <serial>: list Android UI nodes with text/content-desc and centers
adb -s $1 shell uiautomator dump /sdcard/u.xml >/dev/null 2>&1
adb -s $1 shell cat /sdcard/u.xml | python3 -c "
import sys,re
x=sys.stdin.read()
for m in re.finditer(r'<node [^>]*>',x):
  n=m.group(0)
  t=re.search(r' text=\"([^\"]*)\"',n).group(1); d=re.search(r'content-desc=\"([^\"]*)\"',n).group(1)
  if not (t or d): continue
  b=list(map(int,re.findall(r'\d+',re.search(r'bounds=\"([^\"]*)\"',n).group(1))))
  print(repr(t or d)[:60], (b[0]+b[2])//2, (b[1]+b[3])//2)
"
