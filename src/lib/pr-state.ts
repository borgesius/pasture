export type PrCheckState = "success" | "failure" | "pending" | "none"

export type PrReviewState = "approved" | "changes-requested" | "review-required" | "none"

/**
 * The single stage a pull request is in. Ordered by severity when derived:
 * a draft reads as a draft even if CI is red, and a red check outranks a
 * missing review because it blocks regardless of who approves.
 */
export type PrState =
  | "draft"
  | "merge-queue"
  | "re-requested"
  | "changes-requested"
  | "checks-failing"
  | "unresolved"
  | "awaiting-review"
  | "ready"

export const PR_STATE_LABEL: Record<PrState, string> = {
  ready: "Ready to merge",
  "merge-queue": "In merge queue",
  "re-requested": "Re-review requested",
  draft: "Draft",
  "changes-requested": "Changes requested",
  "checks-failing": "Checks not green",
  unresolved: "Unresolved comments",
  "awaiting-review": "Awaiting review",
}

const CHECKS_RANK: Record<PrCheckState, number> = { failure: 0, pending: 1, none: 2, success: 3 }

/**
 * Derive the stage from the raw signals. `ready` is only reached when nothing
 * else is outstanding, so it really does mean "nothing is stopping this".
 */
export function derivePrState(pr: {
  isDraft: boolean
  review: PrReviewState
  checks: PrCheckState
  unresolvedCount: number
  inMergeQueue?: boolean
  reRequested?: boolean
}): PrState {
  if (pr.isDraft) return "draft"
  if (pr.inMergeQueue) return "merge-queue"
  if (pr.review === "changes-requested") return pr.reRequested ? "re-requested" : "changes-requested"
  if (pr.checks === "failure") return "checks-failing"
  if (pr.unresolvedCount > 0) return "unresolved"
  if (pr.review !== "approved") return "awaiting-review"
  if (CHECKS_RANK[pr.checks] < CHECKS_RANK.none) return "checks-failing"
  return "ready"
}
