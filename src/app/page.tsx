import { redirect } from "next/navigation"
import { auth, signIn } from "@/auth"
import { authConfigured, tokenMode } from "@/lib/token"

export const dynamic = "force-dynamic"

export default async function Home() {
  if (tokenMode()) redirect("/pasture")
  const configured = authConfigured()
  if (configured) {
    const session = await auth()
    if (session) redirect("/pasture")
  }
  return (
    <main className="landing">
      <div className="card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/cow-side.png" alt="" />
        <h1>Pasture</h1>
        <p>
          Every pull request on your team is a cow. Drafts, awaiting review, changes requested, ready to merge: one pen each, and a merged
          herd out back. When a PR moves on, the hand of god carries its cow to the next pen.
        </p>
        <div className="pens">
          <span>Drafts</span>
          <span>Awaiting review</span>
          <span>Changes requested</span>
          <span>Ready to merge</span>
          <span>Merged</span>
        </div>
        {configured ? (
          <form
            action={async () => {
              "use server"
              await signIn("github", { redirectTo: "/pasture" })
            }}
          >
            <button className="github" type="submit">
              <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
              </svg>
              Sign in with GitHub
            </button>
          </form>
        ) : (
          <div className="warn">
            Sign-in is not configured on this deployment yet. Set <code>AUTH_GITHUB_ID</code>, <code>AUTH_GITHUB_SECRET</code> and{" "}
            <code>AUTH_SECRET</code> (see <code>.env.example</code>).
          </div>
        )}
        <p className="fine">
          Asks GitHub for <code>repo</code> and <code>read:org</code> so it can see your team&apos;s private pull requests. Your token stays
          in an encrypted cookie and is only ever used to ask GitHub about pull requests.
        </p>
      </div>
    </main>
  )
}
