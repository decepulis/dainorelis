#!/bin/zsh
# tap <udid> <x> <y>: a timed touch, since axe's quick tap doesn't register on Xcode 27 sims
axe touch -x $2 -y $3 --down --up --delay 0.12 --udid $1 >/dev/null
