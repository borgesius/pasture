// Screenshot the kiosk window through Chrome's loopback debugging port:
//   node scripts/mini/tv-shot.mjs /tmp/tv.jpg
import { writeFileSync } from "node:fs"

const port = process.env.PASTURE_TV_DEBUG_PORT || 9333
const targets = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json())
const page = targets.find((t) => t.type === "page" && t.url.includes("/pasture")) || targets.find((t) => t.type === "page")
if (!page) throw new Error("no kiosk page is open")
const ws = new WebSocket(page.webSocketDebuggerUrl)
await new Promise((resolve, reject) => {
  ws.onopen = resolve
  ws.onerror = reject
})
let id = 0
const pending = new Map()
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data)
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg)
    pending.delete(msg.id)
  }
}
const call = (method, params = {}) =>
  new Promise((resolve) => {
    const n = ++id
    pending.set(n, resolve)
    ws.send(JSON.stringify({ id: n, method, params }))
  })
const metrics = await call("Page.getLayoutMetrics")
const shot = await call("Page.captureScreenshot", { format: "jpeg", quality: 80 })
writeFileSync(process.argv[2] || "tv.jpg", Buffer.from(shot.result.data, "base64"))
const size = metrics.result?.cssVisualViewport
console.log(`${page.title} · ${page.url} · ${size ? `${Math.round(size.clientWidth)}x${Math.round(size.clientHeight)}` : "?"}`)
ws.close()
