import { describe, expect, test } from "vitest"
import { derivePrState } from "./pr-state"

const base = { isDraft: false, review: "review-required" as const, checks: "success" as const, unresolvedCount: 0 }

describe("derivePrState", () => {
  test("the most actionable problem wins", () => {
    expect(derivePrState({ ...base, isDraft: true, checks: "failure" })).toBe("draft")
    expect(derivePrState({ ...base, inMergeQueue: true, review: "approved" })).toBe("merge-queue")
    expect(derivePrState({ ...base, review: "changes-requested" })).toBe("changes-requested")
    expect(derivePrState({ ...base, review: "changes-requested", reRequested: true })).toBe("re-requested")
    expect(derivePrState({ ...base, checks: "failure" })).toBe("checks-failing")
    expect(derivePrState({ ...base, review: "approved", unresolvedCount: 1 })).toBe("unresolved")
    expect(derivePrState(base)).toBe("awaiting-review")
    expect(derivePrState({ ...base, review: "approved", checks: "pending" })).toBe("checks-failing")
    expect(derivePrState({ ...base, review: "approved" })).toBe("ready")
    expect(derivePrState({ ...base, review: "approved", checks: "none" })).toBe("ready")
  })
})
