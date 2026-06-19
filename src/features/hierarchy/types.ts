import type { EmployeeStatus } from "@prisma/client";

export interface OrgUser {
  id: string;
  name: string;
  levelName: string;
  levelRank: number;
  status: EmployeeStatus;
  managerId: string | null;
  prospectCount: number;
  reportCount: number;
}
