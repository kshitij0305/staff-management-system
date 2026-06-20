import { describe, it, expect } from "vitest";
import { FieldType } from "@prisma/client";
import { slugifyKey, validateCustomFields, type FieldDef } from "./schemas";

function def(over: Partial<FieldDef> & { type: FieldType }): FieldDef {
  return {
    id: "f1",
    key: over.key ?? "k",
    label: over.label ?? "Field",
    options: over.options ?? [],
    required: over.required ?? false,
    order: 0,
    ...over,
  };
}

describe("slugifyKey", () => {
  it("turns a label into a stable machine key", () => {
    expect(slugifyKey("Next Follow-up Date!")).toBe("next_follow_up_date");
    expect(slugifyKey("  GPS  ")).toBe("gps");
  });
});

describe("validateCustomFields — coercion + persistence shape", () => {
  it("coerces numbers and trims text", () => {
    const defs = [def({ key: "age", type: "NUMBER" }), def({ key: "note", type: "TEXT" })];
    const r = validateCustomFields(defs, { age: "42", note: "  hi  " });
    expect(r).toEqual({ ok: true, values: { age: 42, note: "hi" } });
  });

  it("normalizes a DATE to ISO and a BOOLEAN from string", () => {
    const defs = [def({ key: "d", type: "DATE" }), def({ key: "b", type: "BOOLEAN" })];
    const r = validateCustomFields(defs, { d: "2026-01-15", b: "true" });
    expect(r.ok && r.values.b).toBe(true);
    expect(r.ok && (r.values.d as string).startsWith("2026-01-15")).toBe(true);
  });

  it("accepts a valid GEO point and keeps accuracy", () => {
    const defs = [def({ key: "loc", type: "GEO" })];
    const r = validateCustomFields(defs, { loc: { lat: 28.6, lng: 77.2, accuracy: 12 } });
    expect(r).toEqual({ ok: true, values: { loc: { lat: 28.6, lng: 77.2, accuracy: 12 } } });
  });
});

describe("validateCustomFields — rejection + safety", () => {
  it("rejects a missing required field", () => {
    const defs = [def({ key: "x", label: "Source", type: "TEXT", required: true })];
    expect(validateCustomFields(defs, {})).toEqual({ ok: false, error: '"Source" is required' });
  });

  it("rejects a value outside a dropdown's options", () => {
    const defs = [def({ key: "s", type: "SELECT", options: ["A", "B"] })];
    expect(validateCustomFields(defs, { s: "C" }).ok).toBe(false);
  });

  it("rejects out-of-range coordinates", () => {
    const defs = [def({ key: "loc", type: "GEO" })];
    expect(validateCustomFields(defs, { loc: { lat: 999, lng: 0 } }).ok).toBe(false);
  });

  it("drops unknown keys — never trusts client-supplied extras", () => {
    const defs = [def({ key: "known", type: "TEXT" })];
    const r = validateCustomFields(defs, { known: "ok", evil: "ignored" });
    expect(r.ok && r.values).toEqual({ known: "ok" });
  });

  it("skips empty optional fields without erroring", () => {
    const defs = [def({ key: "opt", type: "TEXT", required: false })];
    expect(validateCustomFields(defs, { opt: "" })).toEqual({ ok: true, values: {} });
  });
});
