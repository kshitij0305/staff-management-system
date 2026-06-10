import type { Role, EmployeeStatus } from "@prisma/client";

export interface EmployeeRow {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  status: EmployeeStatus;
  joiningDate: string;
  city: string | null;
  state: string | null;
  manager: { id: string; name: string } | null;
  _count: { reports: number; prospects: number };
}

export interface EmployeeDetail extends EmployeeRow {
  ancestorIds: string[];
  manager: { id: string; name: string; role: Role } | null;
  reports: {
    id: string;
    name: string;
    role: Role;
    status: EmployeeStatus;
    _count: { prospects: number };
  }[];
}
