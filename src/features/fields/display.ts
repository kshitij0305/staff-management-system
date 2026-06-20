import type { FieldDef, GeoValue } from "./schemas";

/** Render a stored custom value as plain text (CSV export, table fallback). */
export function customValueToText(def: Pick<FieldDef, "type">, value: unknown): string {
  if (value === undefined || value === null || value === "") return "";
  switch (def.type) {
    case "BOOLEAN":
      return value === true ? "Yes" : "No";
    case "DATE":
      return typeof value === "string" ? value.slice(0, 10) : "";
    case "GEO": {
      const g = value as GeoValue;
      return g && typeof g.lat === "number" ? `${g.lat}, ${g.lng}` : "";
    }
    case "IMAGE":
      return String(value); // the URL
    default:
      return String(value);
  }
}
