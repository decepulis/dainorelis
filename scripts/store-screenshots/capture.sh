#!/bin/zsh
# Helpers for taking the raw store captures; see README.md for the shot list.
#   capture.sh prep ios <udid> | android <serial>        clean status bar (9:41, full battery and signal)
#   capture.sh open ios <udid> | android <serial> <url>  open a deep link, e.g. dainorelis://dainos/<id>
#   capture.sh shot ios <udid> | android <serial> <target> <n>
#                                                        save captures/<target>/<n>.png (target as in config.json)
set -e
cd "${0:A:h}"
cmd=$1 platform=$2 device=$3
shift 3

case "$cmd:$platform" in
  prep:ios)
    xcrun simctl status_bar "$device" override --time 9:41 --batteryState discharging --batteryLevel 100 \
      --cellularMode active --cellularBars 4 --wifiBars 3 --operatorName '' ;;
  prep:android)
    adb -s "$device" shell settings put global sysui_demo_allowed 1
    demo() { adb -s "$device" shell am broadcast -a com.android.systemui.demo -e command "$@" >/dev/null; }
    demo enter
    demo clock -e hhmm 0941
    demo battery -e level 100 -e plugged false
    demo network -e wifi show -e level 4 -e fully true -e mobile hide
    demo notifications -e visible false ;;
  open:ios) xcrun simctl openurl "$device" "$1" ;;
  open:android) adb -s "$device" shell am start -a android.intent.action.VIEW -d "'$1'" >/dev/null ;;
  shot:ios)
    mkdir -p "captures/$1"
    xcrun simctl io "$device" screenshot "captures/$1/$2.png" ;;
  shot:android)
    mkdir -p "captures/$1"
    adb -s "$device" exec-out screencap -p > "captures/$1/$2.png" ;;
  *) sed -n '2,6p' "$0"; exit 1 ;;
esac
