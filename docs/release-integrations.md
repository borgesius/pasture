# Release integrations

Pasture can optionally show release state without depending on a particular CI/CD product. A
small adapter translates whatever your release system knows into one HTTP JSON feed:

- `waiting`: pull requests merged into the release branch but not present in the production
  marker. For a branch-based pipeline this is commonly the `production...main` diff.
- `recent`: pull requests verified in production during a lookback chosen by the adapter (24
  hours is a useful default).
- `events`: scheduled or live release attempts. These drive the release status and the animated
  weather over the field.

Set the URL on the Pasture server:

```dotenv
PASTURE_RELEASE_FEED_URL=https://releases.example.com/pasture
PASTURE_RELEASE_FEED_TOKEN=a-server-only-bearer-token
PASTURE_RELEASE_SCOPES=acme
```

`PASTURE_RELEASE_SCOPES` is a comma-separated allowlist and defaults to
`PASTURE_DEFAULT_ORG`. Pasture only fetches and returns the feed while someone is looking at an
allowed organization's field and their GitHub identity belongs to that organization. The bearer
token stays on the server.

Pasture makes a `GET` request with `Accept: application/json`, the optional bearer token, and an
`X-Pasture-Scope` header containing the lower-case organization name. The response is schema
version 1:

```json
{
  "schemaVersion": 1,
  "generatedAt": "2026-09-15T18:04:00Z",
  "window": {
    "active": true,
    "label": "Tuesday production hour",
    "startsAt": "2026-09-15T18:00:00Z",
    "endsAt": "2026-09-15T19:00:00Z"
  },
  "waiting": [
    {
      "repo": "acme/widgets",
      "number": 42,
      "title": "Make the widget shinier",
      "url": "https://github.com/acme/widgets/pull/42",
      "author": "octocat",
      "authorAvatar": "https://avatars.githubusercontent.com/u/583231",
      "mergedAt": "2026-09-15T17:21:00Z",
      "base": "main",
      "targets": ["web"]
    }
  ],
  "recent": [
    {
      "repo": "acme/api",
      "number": 91,
      "title": "Faster responses",
      "url": "https://github.com/acme/api/pull/91",
      "author": "mona",
      "mergedAt": "2026-09-15T12:10:00Z",
      "releasedAt": "2026-09-15T18:03:00Z",
      "targets": ["api"]
    }
  ],
  "events": [
    {
      "id": "release-2026-09-15-web",
      "label": "Web",
      "environment": "production",
      "phase": "verifying",
      "startedAt": "2026-09-15T18:01:00Z",
      "updatedAt": "2026-09-15T18:04:00Z",
      "url": "https://ci.example.com/runs/1234",
      "summary": "Health checks",
      "pullRequests": ["acme/widgets#42"]
    }
  ]
}
```

Only `repo`, `number`, `title`, `url`, `author`, and `mergedAt` are needed for a pull request.
Pasture accepts these event phases:

| Phase | Meaning in the field |
| --- | --- |
| `scheduled` | The release window is open; the sky begins to turn. |
| `queued` | A release attempt exists but has not started work. |
| `testing` | Release tests or pre-deploy checks are running. |
| `deploying` | Production is changing; the mothership and storm peak. |
| `verifying` | Production health is being checked. |
| `succeeded` | A short green clearing after success. |
| `failed` | A short red storm that links to the failed attempt. |

Live phases take priority when several services release at once. A terminal event remains visible
for five minutes when it has an `updatedAt`. The adapter should move a pull request from `waiting`
to `recent` only after the production environment is authoritative and verified; that feed change
is what makes the hand (or the occasional little UFO) carry its cow into the release paddock.
