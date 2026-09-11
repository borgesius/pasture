// Record the hand of god carrying a cow between pens, from a real render of the dev server.
//   npm run dev            (in another terminal; the dev build exposes window.__pasture)
//   node scripts/media/record-hand-of-god.mjs docs/media/hand-of-god.webm
// Then: ffmpeg turns the webm into the mp4 and gif the README uses (see package.json "media").
import { chromium } from "playwright-core"
import { mkdtempSync, readdirSync, renameSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const out = process.argv[2] || "docs/media/hand-of-god.webm"
const url = process.env.PASTURE_URL || "http://localhost:3517/pasture?org=coval-ai"
const dir = mkdtempSync(join(tmpdir(), "pasture-video-"))
const browser = await chromium.launch({ channel: "chrome", headless: true })
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 1,
  recordVideo: { dir, size: { width: 1280, height: 720 } },
})
const page = await context.newPage()
await page.goto(url, { waitUntil: "domcontentloaded" })
await page.waitForFunction(() => (window.__pasture?.specs?.length ?? 0) > 0, null, { timeout: 90_000 })
await page.waitForTimeout(1500)
// Tilt a touch further over the field and lean in, so the front pens and their signs fill the frame.
const tilt = Number(process.env.PASTURE_TILT ?? -18)
const zoom = Number(process.env.PASTURE_ZOOM ?? 170)
await page.mouse.move(640, 420)
await page.mouse.down()
await page.mouse.move(640, 420 - tilt, { steps: 12 })
await page.mouse.up()
// Right-drag pans; sliding the scene up brings the front pens (and their signs) into the frame.
const pan = Number(process.env.PASTURE_PAN ?? 100)
await page.mouse.move(640, 480)
await page.mouse.down({ button: "right" })
await page.mouse.move(640, 480 - pan, { steps: 12 })
await page.mouse.up({ button: "right" })
await page.mouse.wheel(0, -zoom)
await page.waitForTimeout(1500)
if (process.env.PASTURE_FRAME_ONLY) {
  await page.screenshot({ path: process.env.PASTURE_FRAME_ONLY })
  await context.close()
  await browser.close()
  console.log("framing screenshot:", process.env.PASTURE_FRAME_ONLY)
  process.exit(0)
}

const move = (from, to) =>
  page.evaluate(([from, to]) => {
    const h = window.__pasture
    const specs = h.specs.map((s) => ({ ...s }))
    const cow = specs.find((s) => s.pen === from)
    if (!cow) return null
    cow.pen = to
    h.scene.setCows(specs, true)
    h.specs = specs
    return cow.id
  }, [from, to])

console.log("move 1:", await move("awaiting", "ready"))
await page.waitForTimeout(8500)
console.log("move 2:", await move("ready", "merged"))
await page.waitForTimeout(9000)
await context.close()
await browser.close()
const file = readdirSync(dir).find((f) => f.endsWith(".webm"))
renameSync(join(dir, file), out)
console.log("wrote", out)
