import type { EmployeeStatus } from "@prisma/client";

export interface LevelLite {
  id: string;
  name: string;
  rank: number;
  seesAll: boolean;
}

export interface EmployeeRow {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  level: LevelLite;
  status: EmployeeStatus;
  joiningDate: string;
  city: string | null;
  state: string | null;
  manager: { id: string; name: string } | null;
  _count: { reports: number; prospects: number };
}
