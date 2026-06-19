import type { Prisma } from "@prisma/client";
import type { SessionPayload } from "./auth";

/**
 * Authorization is fully data-driven now: an org defines its own ordered
 * `Level` records (rank 1 = leaf … N = top). All checks operate on rank.
 *
 * The #1 safety rule: every User/Prospect/ActivityLog query goes through a
 * `scoped*` helper so `organizationId` is ALWAYS applied — that's what keeps
 * tenants isolated.
 */

/** Top-level users (seesAll) see the whole org; everyone else, only their subtree. */
export function seesEverything(session: SessionPayload): boolean {
  return session.seesAll;
}

/** Visibility filter for User queries — org-scoped, plus subtree for non-top levels. */
export function scopedUserWhere(session: SessionPayload): Prisma.UserWhereInput {
  const tenant: Prisma.UserWhereInput = { organizationId: session.orgId };
  if (session.seesAll) return tenant;
  return {
    AND: [tenant, { OR: [{ id: session.sub }, { ancestorIds: { has: session.sub } }] }],
  };
}

/** Visibility filter for Prospect queries — org-scoped, plus collector-subtree for non-top levels. */
export function scopedProspectWhere(session: SessionPayload): Prisma.ProspectWhereInput {
  const tenant: Prisma.ProspectWhereInput = { organizationId: session.orgId };
  if (session.seesAll) return tenant;
  return {
    AND: [
      tenant,
      {
        OR: [
          { collectedById: session.sub },
          { collectedBy: { is: { ancestorIds: { has: session.sub } } } },
        ],
      },
    ],
  };
}

/** Visibility filter for ActivityLog queries — org-scoped, plus actor-subtree for non-top levels. */
export function scopedActivityWhere(session: SessionPayload): Prisma.ActivityLogWhereInput {
  const tenant: Prisma.ActivityLogWhereInput = { organizationId: session.orgId };
  if (session.seesAll) return tenant;
  return {
    AND: [
      tenant,
      {
        OR: [
          { actorId: session.sub },
          { actor: { is: { ancestorIds: { has: session.sub } } } },
        ],
      },
    ],
  };
}

/**
 * Which level rank a given actor may create. Top level (seesAll) can create
 * anyone below them; everyone else can only create the level directly beneath.
 */
export function canCreateRank(
  actor: { levelRank: number; seesAll: boolean },
  targetRank: number
): boolean {
  if (targetRank >= actor.levelRank) return false; // never create a peer or senior
  if (actor.seesAll) return true; // top can create any level below
  return targetRank === actor.levelRank - 1; // others: only the level directly below
}

/** The rank a manager of a user at `rank` must hold (one level up). */
export function managerRankFor(rank: number): number {
  return rank + 1;
}

/** True if `session` may manage (edit/deactivate/transfer) the target user. */
export function canManageUser(
  session: SessionPayload,
  target: { id: string; ancestorIds: string[] }
): boolean {
  if (target.id === session.sub) return false; // use Settings for yourself
  if (session.seesAll) return true; // top level manages anyone in the org
  return target.ancestorIds.includes(session.sub); // others: only their subtree
}
