import type { ProspectStatus } from "@prisma/client";

export interface ProspectRow {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  visitDate: string;
  status: ProspectStatus;
  remarks: string | null;
  createdAt: string;
  collectedBy: { id: string; name: string; employeeId: string };
}
