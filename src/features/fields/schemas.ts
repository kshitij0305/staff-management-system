import { z } from "zod";
import { FieldType, type Prisma } from "@prisma/client";

/** Shape of a field definition as the client/forms consume it. */
export interface FieldDef {
  id: string;
  key: string;
  label: string;
  type: FieldType;
  options: string[];
  required: boolean;
  order: number;
}

/** A captured GPS point. */
export interface GeoValue {
  lat: number;
  lng: number;
  accuracy?: number;
}

/** Derive a stable machine key from a human label. */
export function slugifyKey(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

const SELECT_OPTION = z.string().trim().min(1).max(60);

/** Owner-supplied definition of a custom field. */
export const createFieldSchema = z
  .object({
    label: z.string().trim().min(2, "Label is too short").max(40),
    type: z.nativeEnum(FieldType),
    options: z.array(SELECT_OPTION).max(30).optional().default([]),
    required: z.boolean().optional().default(false),
  })
  .refine((d) => d.type !== "SELECT" || d.options.length >= 2, {
    message: "A dropdown needs at least two options",
    path: ["options"],
  });
export type CreateFieldInput = z.infer<typeof createFieldSchema>;

/** Label/options/required/order are editable; type and key are immutable once set. */
export const updateFieldSchema = z
  .object({
    label: z.string().trim().min(2).max(40).optional(),
    options: z.array(SELECT_OPTION).max(30).optional(),
    required: z.boolean().optional(),
    order: z.number().int().min(0).max(999).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "Nothing to update" });
export type UpdateFieldInput = z.infer<typeof updateFieldSchema>;

/**
 * Validate + coerce a raw `customFields` payload against the org's definitions.
 * Returns the cleaned object to persist, or a first error message. Unknown keys
 * are dropped (never trusted); missing required fields are rejected.
 */
export function validateCustomFields(
  defs: FieldDef[],
  raw: unknown
): { ok: true; values: Prisma.InputJsonObject } | { ok: false; error: string } {
  const input: Record<string, unknown> =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const out: Record<string, unknown> = {};

  for (const def of defs) {
    const v = input[def.key];
    const empty = v === undefined || v === null || v === "";

    if (empty) {
      if (def.required) return { ok: false, error: `"${def.label}" is required` };
      continue;
    }

    switch (def.type) {
      case "TEXT": {
        const s = String(v).trim();
        if (s.length > 500) return { ok: false, error: `"${def.label}" is too long` };
        out[def.key] = s;
        break;
      }
      case "NUMBER": {
        const n = Number(v);
        if (!Number.isFinite(n)) return { ok: false, error: `"${def.label}" must be a number` };
        out[def.key] = n;
        break;
      }
      case "SELECT": {
        const s = String(v);
        if (!def.options.includes(s))
          return { ok: false, error: `"${def.label}" has an invalid option` };
        out[def.key] = s;
        break;
      }
      case "DATE": {
        const t = Date.parse(String(v));
        if (Number.isNaN(t)) return { ok: false, error: `"${def.label}" is not a valid date` };
        out[def.key] = new Date(t).toISOString();
        break;
      }
      case "BOOLEAN": {
        out[def.key] = v === true || v === "true";
        break;
      }
      case "GEO": {
        const g = v as Partial<GeoValue>;
        const lat = Number(g?.lat);
        const lng = Number(g?.lng);
        if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180)
          return { ok: false, error: `"${def.label}" has invalid coordinates` };
        out[def.key] = { lat, lng, ...(Number.isFinite(Number(g?.accuracy)) ? { accuracy: Number(g!.accuracy) } : {}) };
        break;
      }
      case "IMAGE": {
        const s = String(v);
        if (!/^https?:\/\//.test(s)) return { ok: false, error: `"${def.label}" must be an uploaded image` };
        out[def.key] = s;
        break;
      }
    }
  }

  return { ok: true, values: out as Prisma.InputJsonObject };
}
