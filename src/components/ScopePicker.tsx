"use client"

import type { Viewer } from "@/lib/pasture/types"

/** Whose field: one of your organizations, or just your own pull requests. */
export function ScopePicker(props: { value: string; viewer: Viewer | undefined; onChange: (scope: string) => void }) {
  const options: { value: string; label: string }[] = (props.viewer?.orgs ?? []).map((org) => ({ value: org.login, label: org.name || org.login }))
  options.sort((a, b) => a.label.localeCompare(b.label))
  options.push({ value: "me", label: props.viewer ? `Just @${props.viewer.login}` : "Just my PRs" })
  if (!options.some((option) => option.value === props.value)) options.unshift({ value: props.value, label: props.value })
  return (
    <select className="select" value={props.value} onChange={(event) => props.onChange(event.target.value)} aria-label="Whose pull requests to show">
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
