import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"

/**
 * Sign in with GitHub. The OAuth token is kept in the encrypted session JWT
 * and only ever read on the server (see lib/token.ts); the browser gets the
 * login and avatar, nothing else. `repo` is needed to see private pull
 * requests, `read:org` to list organizations.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [GitHub({ authorization: { params: { scope: "read:user user:email read:org repo" } } })],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    jwt({ token, account, profile }) {
      if (account?.access_token) token.accessToken = account.access_token
      if (profile && typeof profile.login === "string") token.login = profile.login
      return token
    },
    session({ session, token }) {
      if (typeof token.login === "string") session.user.login = token.login
      return session
    },
  },
})
