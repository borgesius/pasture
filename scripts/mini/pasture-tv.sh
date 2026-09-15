#!/bin/bash
# The kiosk: wait until the local server answers, then hand the process over to Chrome.
# Chrome's "refused to connect" page never retries, so a TV that boots before the server
# would otherwise sit on an error forever.
set -u
PORT="${PASTURE_PORT:-3517}"
DEBUG_PORT="${PASTURE_TV_DEBUG_PORT:-9333}"
CHROME="${PASTURE_CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
URL="http://127.0.0.1:$PORT/pasture?tour=1"
for i in $(seq 1 300); do
  if curl -fsS -o /dev/null "$URL" 2>/dev/null; then break; fi
  sleep 2
done
exec "$CHROME" \
  --user-data-dir="$HOME/.config/pasture-tv" \
  --kiosk \
  --no-first-run \
  --no-default-browser-check \
  --noerrdialogs \
  --disable-session-crashed-bubble \
  --disable-features=TranslateUI \
  --autoplay-policy=no-user-gesture-required \
  --window-position=0,0 \
  --remote-debugging-port="$DEBUG_PORT" \
  "$URL"
