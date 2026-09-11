import "server-only"

/**
 * Datadog monitors in the Alert state, for the wolves. Read-only: one monitor
 * search per minute with the deployment's API and application keys. Nothing
 * here runs unless all three keys are set.
 */
import { parseMonitors, type Alert } from "./datadog-parse"

export type { Alert }

const CACHE_MS = 60_000
const PAGE = 100

export function datadogConfigured() {
  return !!process.env.DD_API_KEY && !!process.env.DD_APP_KEY
}

const site = () => process.env.DD_SITE || "datadoghq.com"

/** What counts as an alert. `DD_MONITOR_QUERY` narrows it, e.g. `status:alert tag:team:pipeline`. */
const query = () => process.env.DD_MONITOR_QUERY || "status:alert"

let cache: { at: number; value: Promise<Alert[]> } | undefined

export function fetchAlerts(now = Date.now()): Promise<Alert[]> {
  if (!datadogConfigured()) return Promise.resolve([])
  if (cache && now - cache.at < CACHE_MS) return cache.value
  const value = (async () => {
    const url = new URL(`https://api.${site()}/api/v1/monitor/search`)
    url.searchParams.set("query", query())
    url.searchParams.set("per_page", String(PAGE))
    const response = await fetch(url, {
      headers: { "DD-API-KEY": process.env.DD_API_KEY!, "DD-APPLICATION-KEY": process.env.DD_APP_KEY!, accept: "application/json" },
      cache: "no-store",
    })
    if (!response.ok) throw new Error(`Datadog ${response.status}: ${(await response.text().catch(() => "")).slice(0, 160)}`)
    return parseMonitors(await response.json(), site())
  })().catch((error: Error) => {
    cache = undefined
    throw error
  })
  cache = { at: now, value }
  return value
}
