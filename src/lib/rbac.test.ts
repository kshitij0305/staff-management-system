import { describe, it, expect } from "vitest";
import type { SessionPayload } from "./auth";
import {
  seesEverything,
  scopedUserWhere,
  scopedProspectWhere,
  scopedActivityWhere,
  canCreateRank,
  managerRankFor,
  canManageUser,
} from "./rbac";

/**
 * These tests guard THE invariant of the product: tenant isolation. Every
 * `scoped*Where` helper must pin `organizationId` to the caller's org in
 * EVERY branch, and non-top users must additionally be fenced to their subtree.
 * If any of these break, one tenant can read another tenant's data.
 */

/** Prisma types `AND` as `T | T[]`; in these helpers it's always an array. */
function and(where: { AND?: unknown }): Record<string, unknown>[] {
  return (Array.isArray(where.AND) ? where.AND : [where.AND]) as Record<string, unknown>[];
}

function session(over: Partial<SessionPayload> = {}): SessionPayload {
  return {
    sub: "user-self",
    name: "Test User",
    employeeId: "EMP-0001",
    orgId: "org-A",
    levelRank: 1,
    seesAll: false,
    ...over,
  };
}

const topOfA = session({ orgId: "org-A", seesAll: true, levelRank: 5, sub: "owner-A" });
const leafOfA = session({ orgId: "org-A", seesAll: false, levelRank: 1, sub: "leaf-A" });

describe("tenant isolation — organizationId is always pinned", () => {
  it("user filter pins orgId for a top-level (seesAll) user", () => {
    expect(scopedUserWhere(topOfA)).toEqual({ organizationId: "org-A" });
  });

  it("user filter pins orgId AND subtree for a non-top user", () => {
    const where = scopedUserWhere(leafOfA);
    // AND[0] is the tenant clause — must always be present.
    expect(and(where)[0]).toEqual({ organizationId: "org-A" });
  });

  it("prospect + activity filters both pin orgId for every level", () => {
    for (const s of [topOfA, leafOfA]) {
      const p = scopedProspectWhere(s);
      const a = scopedActivityWhere(s);
      const pOrg = s.seesAll ? p.organizationId : and(p)[0].organizationId;
      const aOrg = s.seesAll ? a.organizationId : and(a)[0].organizationId;
      expect(pOrg).toBe(s.orgId);
      expect(aOrg).toBe(s.orgId);
    }
  });

  it("two tenants never produce the same org filter", () => {
    const a = scopedUserWhere(session({ orgId: "org-A", seesAll: true }));
    const b = scopedUserWhere(session({ orgId: "org-B", seesAll: true }));
    expect(a).not.toEqual(b);
  });
});

describe("subtree fencing for non-top users", () => {
  it("user filter limits non-top users to self + descendants", () => {
    const where = scopedUserWhere(leafOfA);
    expect(and(where)[1]).toEqual({
      OR: [{ id: "leaf-A" }, { ancestorIds: { has: "leaf-A" } }],
    });
  });

  it("prospect filter limits non-top users to their collectors", () => {
    const where = scopedProspectWhere(leafOfA);
    expect(and(where)[1]).toEqual({
      OR: [
        { collectedById: "leaf-A" },
        { collectedBy: { is: { ancestorIds: { has: "leaf-A" } } } },
      ],
    });
  });

  it("top-level users get NO subtree fence (whole org)", () => {
    expect(scopedUserWhere(topOfA).AND).toBeUndefined();
  });
});

describe("seesEverything", () => {
  it("mirrors the seesAll flag", () => {
    expect(seesEverything(topOfA)).toBe(true);
    expect(seesEverything(leafOfA)).toBe(false);
  });
});

describe("canCreateRank", () => {
  it("nobody can create a peer or a senior", () => {
    expect(canCreateRank({ levelRank: 3, seesAll: false }, 3)).toBe(false);
    expect(canCreateRank({ levelRank: 3, seesAll: false }, 4)).toBe(false);
    expect(canCreateRank({ levelRank: 3, seesAll: true }, 3)).toBe(false);
  });

  it("top level can create any rank below it", () => {
    expect(canCreateRank({ levelRank: 5, seesAll: true }, 1)).toBe(true);
    expect(canCreateRank({ levelRank: 5, seesAll: true }, 4)).toBe(true);
  });

  it("non-top level can only create the rank directly below", () => {
    expect(canCreateRank({ levelRank: 3, seesAll: false }, 2)).toBe(true);
    expect(canCreateRank({ levelRank: 3, seesAll: false }, 1)).toBe(false);
  });
});

describe("managerRankFor", () => {
  it("a manager sits exactly one rank above the report", () => {
    expect(managerRankFor(1)).toBe(2);
    expect(managerRankFor(4)).toBe(5);
  });
});

describe("canManageUser", () => {
  const s = session({ sub: "me", orgId: "org-A", seesAll: false });

  it("you can never manage yourself (use Settings)", () => {
    expect(canManageUser(s, { id: "me", ancestorIds: [] })).toBe(false);
    const top = session({ sub: "me", seesAll: true });
    expect(canManageUser(top, { id: "me", ancestorIds: [] })).toBe(false);
  });

  it("top level manages anyone else in the org", () => {
    const top = session({ sub: "owner", seesAll: true });
    expect(canManageUser(top, { id: "someone", ancestorIds: [] })).toBe(true);
  });

  it("non-top level manages only users in its own subtree", () => {
    expect(canManageUser(s, { id: "report", ancestorIds: ["me"] })).toBe(true);
    expect(canManageUser(s, { id: "stranger", ancestorIds: ["other"] })).toBe(false);
  });
});
