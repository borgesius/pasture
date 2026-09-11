# 🐄 Pasture

Every pull request on your team is a cow.

A green field with five fenced pens: **drafts**, **awaiting review**, **changes requested** and
**ready to merge** across the front, and the **merged** herd out back by the pond. Every PR anyone
on the team touched in the last 24 hours (or 7, 30, 90 days) is a cow in the pen for its stage.
When a PR moves on, the hand of god comes down, picks the cow up and carries it to its new pen.
A brand-new PR is lowered in from the sky. A closed one is taken away.

Everyone on the team wears a different coloured cowbell collar, and the legend on the right says
who is who. Hover a cow for its PR. Click it to lift it up (legs dangling) and read what is holding
it up. Double-click to open the PR on GitHub. It moos.

Grown out of the Pasture in [cow code](https://github.com/callumreid/cow_code), which only ever
showed one person's PRs and only inside cow code.

## Run it

```bash
npm install
cp .env.example .env.local   # fill in the GitHub OAuth App values
npm run dev
```

Sign-in is a GitHub **OAuth App** (Settings → Developer settings → OAuth Apps → New):

- Homepage URL: `https://<your-host>`
- Authorization callback URL: `https://<your-host>/api/auth/callback/github`

Put its client id and secret in `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`, and any long random
string in `AUTH_SECRET`. `PASTURE_DEFAULT_ORG` is the organization the field opens on; people can
switch to any organization they belong to, or to just their own PRs.

The app asks for `repo` and `read:org` so it can read private pull requests. The token lives in
the encrypted session cookie and is only read on the server to ask GitHub about pull requests.
If your organization restricts third-party OAuth apps, an owner has to approve this one once.

### Without sign-in

Set `GITHUB_TOKEN` and the app skips sign-in entirely: everyone who can reach the page sees that
token's view of the default organization. Put something in front of it. For local development,
`PASTURE_GH_CLI=1` asks the `gh` CLI for a token at request time instead of storing one.

## How it decides where a cow goes

One stage per PR, the most actionable problem first: draft → in the merge queue → changes
requested (or re-review requested, if the author pushed since) → checks failing → unresolved
comments → awaiting review → ready. Drafts, changes requested and ready get their own pens;
everything else waits in "awaiting review".

A cow whose PR just vanished from the open list waits in its pen for a few minutes so GitHub's
merged search can catch up; that way a merge reads as a move to the back pen, not a disappearance.

## Scripts

```bash
npm run dev         # local dev server
npm run typecheck   # tsc
npm test            # vitest: pens, members, breeds, collars, stage derivation
npm run build       # production build
```

Everything on the field is built from three.js primitives and canvas textures. There are no model
files. A cow is seven meshes sharing one texture atlas per breed, so a few hundred of them fit in
a frame.
