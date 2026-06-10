import { z } from "zod";
import { Role, EmployeeStatus } from "@prisma/client";

export const createEmployeeSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s]{8,15}$/, "Enter a valid phone number"),
  role: z.nativeEnum(Role),
  managerId: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  city: z.string().trim().max(60).optional().or(z.literal("")),
  state: z.string().trim().max(60).optional().or(z.literal("")),
  joiningDate: z.coerce.date().optional(),
});
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

export const updateEmployeeSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s]{8,15}$/, "Enter a valid phone number")
    .optional(),
  city: z.string().trim().max(60).optional().or(z.literal("")),
  state: z.string().trim().max(60).optional().or(z.literal("")),
  status: z.nativeEnum(EmployeeStatus).optional(),
  password: z.string().min(8).max(72).optional().or(z.literal("")),
});
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;

export const transferEmployeeSchema = z.object({
  managerId: z.string().min(1, "Pick a new manager"),
});
