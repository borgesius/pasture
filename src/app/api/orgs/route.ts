import { NextResponse } from "next/server"
import { fetchViewer, GitHubError } from "@/lib/github"
import { resolveToken } from "@/lib/token"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
// A GitHub search over a busy organization takes several seconds; the platform default of ten is too tight.
export const maxDuration = 60

export async function GET(req: Request) {
  const token = await resolveToken(req)
  if (!token) return NextResponse.json({ error: "Not signed in" }, { status: 401 })
  try {
    return NextResponse.json(await fetchViewer(token), { headers: { "cache-control": "private, no-store" } })
  } catch (error) {
    const status = error instanceof GitHubError ? error.status : 502
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status })
  }
}
