#!/bin/zsh
# duoshot.sh <udid> <out.png>: screenshot whichever iPhone Duo display is live (the inactive one comes back
# black); looks the main display IDs up each time, since they change on reboot
U=$1; T=${2:r}
best=""; bestsize=0
for id in $(xcrun simctl io $U enumerate 2>&1 | grep -B5 "Display class: 0" | awk '/UUID/{print $2}'); do
  xcrun simctl io $U screenshot --display=$id $T-$id.png >/dev/null 2>&1 || continue
  size=$(stat -f %z $T-$id.png)
  if (( size > bestsize )); then best=$T-$id.png; bestsize=$size; fi
done
mv $best $2; rm -f $T-*.png; echo $2
