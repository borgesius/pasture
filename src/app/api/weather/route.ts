import { NextResponse } from "next/server"
import { parseOpenMeteo, SAN_FRANCISCO, type Weather } from "@/lib/sky"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/** Open-Meteo, free and keyless; the field asks every ten minutes and this instance remembers the answer. */
const CACHE_MS = 10 * 60_000
let cache: { at: number; value: Weather } | undefined

export async function GET() {
  const now = Date.now()
  if (cache && now - cache.at < CACHE_MS) return NextResponse.json(cache.value, { headers: { "cache-control": "public, max-age=300" } })
  const url = new URL("https://api.open-meteo.com/v1/forecast")
  url.searchParams.set("latitude", String(SAN_FRANCISCO.lat))
  url.searchParams.set("longitude", String(SAN_FRANCISCO.lon))
  url.searchParams.set("current", "temperature_2m,weather_code,cloud_cover,precipitation,rain,snowfall,wind_speed_10m")
  url.searchParams.set("temperature_unit", "fahrenheit")
  url.searchParams.set("timezone", SAN_FRANCISCO.timeZone)
  try {
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) })
    if (!response.ok) throw new Error(`Open-Meteo ${response.status}`)
    const weather = parseOpenMeteo(await response.json(), now)
    if (!weather) throw new Error("Open-Meteo answered without a current block")
    cache = { at: now, value: weather }
    return NextResponse.json(weather, { headers: { "cache-control": "public, max-age=300" } })
  } catch (error) {
    if (cache) return NextResponse.json(cache.value)
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 502 })
  }
}
