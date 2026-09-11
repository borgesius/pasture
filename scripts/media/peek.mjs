// Look closely at one resident of the field, from a real render of the dev server:
//   PEEK_DISTANCE=14 node scripts/media/peek.mjs kobi /tmp/kobi.png --click
// Puts the camera on them (and clicks them, with --click), then screenshots.
import { chromium } from "playwright-core"

const [, , who = "kobi", out = `/tmp/peek-${who}.png`, flag] = process.argv
const url = process.env.PASTURE_URL || "http://localhost:3517/pasture?org=coval-ai"
const distance = Number(process.env.PEEK_DISTANCE ?? 14)
const browser = await chromium.launch({ channel: "chrome", headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 })
await page.goto(url, { waitUntil: "domcontentloaded" })
await page.waitForFunction(() => (window.__pasture?.specs?.length ?? 0) > 0, null, { timeout: 90_000 })
await page.waitForTimeout(1500)
const canvas = await page.locator(".field canvas").boundingBox()
const focus = () => page.evaluate(([id, d]) => window.__pasture.scene.focus(id, d), [who, distance])
const where = async () => {
  const p = await page.evaluate((id) => window.__pasture.scene.screenPosition(id), who)
  return p ? { x: canvas.x + p.x, y: canvas.y + p.y } : null
}
// Put the camera on them, then once more right before the shot: they keep moving.
if (!(await focus())) {
  console.error(`nobody called ${who} on the field`)
  process.exit(1)
}
await page.waitForTimeout(700)
await focus()
await page.waitForTimeout(150)
const at = await where()
if (flag === "--click" && at) {
  await page.mouse.click(at.x, at.y + 18)
  await page.waitForTimeout(900)
}
await page.screenshot({ path: out })
console.log(`${who} at`, at ? `${Math.round(at.x)},${Math.round(at.y)}` : "off-screen", "->", out)
await browser.close()
