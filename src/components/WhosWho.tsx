"use client"

import { useEffect, useRef, useState } from "react"
import type { CollarColor } from "@/lib/pasture/collars"

export type WhosWhoPerson = { login: string; avatarUrl: string | null; collar: CollarColor | undefined }

/**
 * Who is who: everyone with a cow on the field and the collar they wear,
 * tucked into a dropdown. Pick a person to light up their cows; pick them
 * again, or "Everyone", to put the rest back.
 */
export function WhosWho(props: { people: WhosWhoPerson[]; focus: string | undefined; onFocus: (login: string | undefined) => void }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const focused = props.people.find((person) => person.login === props.focus)

  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", onPointer)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onPointer)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  if (!props.people.length) return null
  return (
    <div className="whoswho" ref={rootRef}>
      <button type="button" className="textbtn whoswho-toggle" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        {focused ? (
          <span className="who" style={{ "--collar": focused.collar ?? "#ccc" } as React.CSSProperties}>
            <span className="bell" aria-hidden="true" />
            {focused.login}
          </span>
        ) : (
          <span className="who">
            <span className="stack" aria-hidden="true">
              {props.people.slice(0, 4).map((person) =>
                person.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={person.login} className="avatar tiny" src={person.avatarUrl} alt="" referrerPolicy="no-referrer" style={{ "--collar": person.collar ?? "#ccc" } as React.CSSProperties} />
                ) : (
                  <span key={person.login} className="avatar tiny" style={{ "--collar": person.collar ?? "#ccc" } as React.CSSProperties} />
                ),
              )}
            </span>
            Who&apos;s who
          </span>
        )}
        <span className="caret" aria-hidden="true">
          ▾
        </span>
      </button>
      {open ? (
        <div className="whoswho-menu" role="listbox" aria-label="People on the field">
          <button type="button" className="person" role="option" aria-selected={!props.focus} onClick={() => props.onFocus(undefined)}>
            <span className="avatar everyone" aria-hidden="true" />
            <span className="login">Everyone</span>
          </button>
          {props.people.map((person) => (
            <button
              key={person.login}
              type="button"
              className="person"
              role="option"
              aria-selected={props.focus === person.login}
              style={{ "--collar": person.collar ?? "#ccc" } as React.CSSProperties}
              onClick={() => props.onFocus(props.focus === person.login ? undefined : person.login)}
            >
              {person.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="avatar" src={person.avatarUrl} alt="" referrerPolicy="no-referrer" />
              ) : (
                <span className="avatar" />
              )}
              <span className="bell" aria-hidden="true" />
              <span className="login">{person.login}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
