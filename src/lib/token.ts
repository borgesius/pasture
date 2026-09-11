import "server-only"
import { execFile } from "node:child_process"
import { getToken } from "next-auth/jwt"

/**
 * Where the GitHub token comes from, in order:
 * 1. `GITHUB_TOKEN`: a self-hosted single-team field; everyone sees that token's view.
 * 2. `PASTURE_GH_CLI=1`: local development; ask the gh CLI at request time, never store it.
 * 3. The signed-in person's own OAuth token, read from their session cookie.
 */
export function tokenMode() {
  return !!process.env.GITHUB_TOKEN || process.env.PASTURE_GH_CLI === "1"
}

export function authConfigured() {
  return !!process.env.AUTH_GITHUB_ID && !!process.env.AUTH_GITHUB_SECRET && !!process.env.AUTH_SECRET
}

let cliToken: { value: string; at: number } | undefined

function ghCliToken(): Promise<string> {
  if (cliToken && Date.now() - cliToken.at < 10 * 60_000) return Promise.resolve(cliToken.value)
  return new Promise((resolve, reject) => {
    execFile(
      "gh",
      ["auth", "token"],
      { timeout: 10_000, env: { ...process.env, PATH: `/opt/homebrew/bin:/usr/local/bin:${process.env.PATH ?? ""}` } },
      (error, stdout, stderr) => {
        if (error) return reject(new Error((stderr || error.message).trim().split("\n")[0] || "gh auth token failed"))
        const value = stdout.trim()
        if (!value) return reject(new Error("gh auth token returned nothing"))
        cliToken = { value, at: Date.now() }
        resolve(value)
      },
    )
  })
}

export async function resolveToken(req: Request): Promise<string | undefined> {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN
  if (process.env.PASTURE_GH_CLI === "1") return ghCliToken()
  const secret = process.env.AUTH_SECRET
  if (!secret) return undefined
  // The cookie name tells us whether Auth.js issued it over https; the JWT salt is the cookie name.
  const cookie = req.headers.get("cookie") ?? ""
  const secureCookie = cookie.includes("__Secure-authjs.session-token")
  const jwt = await getToken({ req, secret, secureCookie }).catch(() => null)
  return typeof jwt?.accessToken === "string" ? jwt.accessToken : undefined
}
