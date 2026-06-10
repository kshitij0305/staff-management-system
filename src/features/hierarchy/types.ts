import type { Role, EmployeeStatus } from "@prisma/client";

export interface OrgUser {
  id: string;
  name: string;
  role: Role;
  status: EmployeeStatus;
  managerId: string | null;
  prospectCount: number;
  reportCount: number;
}
