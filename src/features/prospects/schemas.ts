import { z } from "zod";
import { ProspectStatus } from "@prisma/client";

export const createProspectSchema = z.object({
  customerName: z.string().trim().min(2, "Customer name is too short").max(80),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s]{8,15}$/, "Enter a valid phone number"),
  address: z.string().trim().min(3, "Enter the address").max(200),
  city: z.string().trim().min(2, "Enter the city").max(60),
  state: z.string().trim().min(2, "Enter the state").max(60),
  visitDate: z.coerce.date(),
  status: z.nativeEnum(ProspectStatus),
  remarks: z.string().trim().max(500).optional().or(z.literal("")),
});
export type CreateProspectInput = z.infer<typeof createProspectSchema>;

export const updateProspectSchema = createProspectSchema.partial();
export type UpdateProspectInput = z.infer<typeof updateProspectSchema>;
