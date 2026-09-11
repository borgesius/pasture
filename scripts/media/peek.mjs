// Look closely at one resident of the field, from a real render of the dev server:
//   node scripts/media/peek.mjs kobi /tmp/kobi.png --click
// Pans and zooms the camera onto them (and clicks them, with --click), then screenshots.
import { chromium } from "playwright-core"

const [, , who = "kobi", out = `/tmp/peek-${who}.png`, flag] = process.argv
const url = process.env.PASTURE_URL || "http://localhost:3517/pasture?org=coval-ai"
const browser = await chromium.launch({ channel: "chrome", headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 })
await page.goto(url, { waitUntil: "domcontentloaded" })
await page.waitForFunction(() => (window.__pasture?.specs?.length ?? 0) > 0, null, { timeout: 90_000 })
await page.waitForTimeout(1500)
const canvas = await page.locator(".field canvas").boundingBox()
const centre = { x: canvas.x + canvas.width / 2, y: canvas.y + canvas.height / 2 }
const where = async () => {
  const p = await page.evaluate((id) => window.__pasture.scene.screenPosition(id), who)
  return p ? { x: canvas.x + p.x, y: canvas.y + p.y } : null
}
// Pan toward them in halves (someone near the camera moves faster than the drag), then zoom in.
for (let i = 0; i < 5; i++) {
  const at = await where()
  if (!at) break
  const dx = (centre.x - at.x) * 0.5
  const dy = (centre.y - at.y) * 0.5
  if (Math.hypot(dx, dy) < 12) break
  const sx = Math.min(Math.max(centre.x - dx / 2, canvas.x + 20), canvas.x + canvas.width - 20)
  const sy = Math.min(Math.max(centre.y - dy / 2, canvas.y + 20), canvas.y + canvas.height - 20)
  await page.mouse.move(sx, sy)
  await page.mouse.down({ button: "right" })
  await page.mouse.move(sx + dx, sy + dy, { steps: 10 })
  await page.mouse.up({ button: "right" })
  await page.waitForTimeout(500)
}
await page.mouse.move(centre.x, centre.y)
await page.mouse.wheel(0, -Number(process.env.PEEK_ZOOM ?? 900))
await page.waitForTimeout(1200)
const at = await where()
if (flag === "--click" && at) {
  await page.mouse.click(at.x, at.y + 18)
  await page.waitForTimeout(900)
}
await page.screenshot({ path: out })
console.log(`${who} at`, at ? `${Math.round(at.x)},${Math.round(at.y)}` : "off-screen", "->", out)
await browser.close()
