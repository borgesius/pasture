import { PASTURE_TIMEFRAMES } from "@/lib/pasture/types"

export function relative(iso: string, now: number) {
  const diff = Math.max(0, now - Date.parse(iso))
  if (diff < 60_000) return "just now"
  if (diff < 3_600_000) return `${Math.max(1, Math.floor(diff / 60_000))}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return `${Math.floor(diff / 86_400_000)}d ago`
}

export function absolute(iso: string) {
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
}

export function timeframeLabel(days: number) {
  const known = PASTURE_TIMEFRAMES.find((item) => item.days === days)
  if (known) return `last ${known.label}`
  return `last ${days} day${days === 1 ? "" : "s"}`
}

/** `coval-ai/backend` reads as `backend` when the whole field is coval-ai. */
export function repoShort(repo: string, scope: string) {
  const prefix = `${scope.toLowerCase()}/`
  return repo.toLowerCase().startsWith(prefix) ? repo.slice(prefix.length) : repo
}

export const plural = (n: number, word: string, words = `${word}s`) => `${n} ${n === 1 ? word : words}`
