import { Role } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import type { SessionPayload } from "./auth";

/** Higher rank = higher in the hierarchy. */
export const ROLE_RANK: Record<Role, number> = {
  OWNER: 5,
  NATIONAL_HEAD: 4,
  CSM: 3,
  ASM: 2,
  CPE: 1,
};

/** Which roles each role is allowed to create (always as their own direct reports, except Owner). */
export const CREATABLE_ROLES: Record<Role, Role[]> = {
  OWNER: [Role.NATIONAL_HEAD, Role.CSM, Role.ASM, Role.CPE],
  NATIONAL_HEAD: [Role.CSM],
  CSM: [Role.ASM],
  ASM: [Role.CPE],
  CPE: [],
};

/** The role a manager of the given role must hold. */
export const MANAGER_ROLE: Partial<Record<Role, Role>> = {
  NATIONAL_HEAD: Role.OWNER,
  CSM: Role.NATIONAL_HEAD,
  ASM: Role.CSM,
  CPE: Role.ASM,
};

export function canCreate(actor: Role, target: Role): boolean {
  return CREATABLE_ROLES[actor].includes(target);
}

/** Owner and National Head see the whole company. */
export function seesEverything(role: Role): boolean {
  return role === Role.OWNER || role === Role.NATIONAL_HEAD;
}

/** Visibility filter for User queries: everything, or self + own subtree. */
export function scopedUserWhere(session: SessionPayload): Prisma.UserWhereInput {
  if (seesEverything(session.role)) return {};
  return { OR: [{ id: session.sub }, { ancestorIds: { has: session.sub } }] };
}

/** Visibility filter for Prospect queries: everything, or collected by self / own subtree. */
export function scopedProspectWhere(session: SessionPayload): Prisma.ProspectWhereInput {
  if (seesEverything(session.role)) return {};
  return {
    OR: [
      { collectedById: session.sub },
      { collectedBy: { is: { ancestorIds: { has: session.sub } } } },
    ],
  };
}

/** Visibility filter for ActivityLog queries. */
export function scopedActivityWhere(session: SessionPayload): Prisma.ActivityLogWhereInput {
  if (seesEverything(session.role)) return {};
  return {
    OR: [
      { actorId: session.sub },
      { actor: { is: { ancestorIds: { has: session.sub } } } },
    ],
  };
}

/** True if `session` may manage (edit/deactivate/transfer) the target user. */
export function canManageUser(
  session: SessionPayload,
  target: { id: string; role: Role; ancestorIds: string[] }
): boolean {
  if (target.id === session.sub) return false;
  if (session.role === Role.OWNER) return true;
  if (session.role === Role.NATIONAL_HEAD) return ROLE_RANK[target.role] < ROLE_RANK.NATIONAL_HEAD;
  return target.ancestorIds.includes(session.sub);
}
