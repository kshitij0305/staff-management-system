import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export type ActivityAction =
  | "EMPLOYEE_CREATED"
  | "EMPLOYEE_UPDATED"
  | "EMPLOYEE_DEACTIVATED"
  | "EMPLOYEE_REACTIVATED"
  | "EMPLOYEE_TRANSFERRED"
  | "PROSPECT_ADDED"
  | "PROSPECT_UPDATED"
  | "USER_LOGIN";

export async function logActivity(args: {
  actorId: string;
  action: ActivityAction;
  targetType: "USER" | "PROSPECT" | "AUTH";
  targetId?: string;
  summary: string;
  metadata?: Prisma.InputJsonValue;
}) {
  try {
    await prisma.activityLog.create({
      data: {
        actorId: args.actorId,
        action: args.action,
        targetType: args.targetType,
        targetId: args.targetId,
        summary: args.summary,
        metadata: args.metadata,
      },
    });
  } catch (err) {
    // Activity logging must never break the main mutation.
    console.error("activity log failed", err);
  }
}
