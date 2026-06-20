"use client";

import { useState } from "react";
import { Loader2, MapPin, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FieldDef, GeoValue } from "../schemas";

type Values = Record<string, unknown>;

export function CustomFieldInputs({
  defs,
  values,
  onChange,
}: {
  defs: FieldDef[];
  values: Values;
  onChange: (key: string, value: unknown) => void;
}) {
  if (defs.length === 0) return null;
  return (
    <div className="space-y-3.5 border-t pt-3.5">
      {defs.map((def) => (
        <div key={def.id} className="space-y-1.5">
          <Label htmlFor={`cf-${def.key}`}>
            {def.label}
            {def.required && <span className="ml-0.5 text-rose-500">*</span>}
          </Label>
          <CustomFieldControl def={def} value={values[def.key]} onChange={onChange} />
        </div>
      ))}
    </div>
  );
}

function CustomFieldControl({
  def,
  value,
  onChange,
}: {
  def: FieldDef;
  value: unknown;
  onChange: (key: string, value: unknown) => void;
}) {
  switch (def.type) {
    case "NUMBER":
      return (
        <Input
          id={`cf-${def.key}`}
          type="number"
          value={value === undefined || value === null ? "" : String(value)}
          onChange={(e) => onChange(def.key, e.target.value)}
        />
      );
    case "DATE":
      return (
        <Input
          id={`cf-${def.key}`}
          type="date"
          value={typeof value === "string" ? value.slice(0, 10) : ""}
          onChange={(e) => onChange(def.key, e.target.value)}
        />
      );
    case "BOOLEAN":
      return (
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4 accent-emerald-600"
            checked={value === true}
            onChange={(e) => onChange(def.key, e.target.checked)}
          />
          <span className="text-muted-foreground">Yes</span>
        </label>
      );
    case "SELECT":
      return (
        <Select
          value={typeof value === "string" ? value : ""}
          onValueChange={(v) => onChange(def.key, v)}
        >
          <SelectTrigger id={`cf-${def.key}`} className="w-full">
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {def.options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case "GEO":
      return <GeoControl def={def} value={value as GeoValue | undefined} onChange={onChange} />;
    case "IMAGE":
      return <ImageControl def={def} value={typeof value === "string" ? value : ""} onChange={onChange} />;
    default:
      return (
        <Input
          id={`cf-${def.key}`}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(def.key, e.target.value)}
        />
      );
  }
}

function GeoControl({
  def,
  value,
  onChange,
}: {
  def: FieldDef;
  value: GeoValue | undefined;
  onChange: (key: string, value: unknown) => void;
}) {
  const [locating, setLocating] = useState(false);

  function capture() {
    if (!navigator.geolocation) {
      toast.error("Location isn't available on this device");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange(def.key, {
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          accuracy: Math.round(pos.coords.accuracy),
        });
        setLocating(false);
      },
      (err) => {
        toast.error(err.code === err.PERMISSION_DENIED ? "Location permission denied" : "Couldn't get location");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="outline" size="sm" onClick={capture} disabled={locating}>
        {locating ? <Loader2 className="size-3.5 animate-spin" /> : <MapPin className="size-3.5" />}
        {value ? "Update location" : "Capture location"}
      </Button>
      {value && (
        <a
          href={`https://www.google.com/maps?q=${value.lat},${value.lng}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-emerald-600 hover:underline dark:text-emerald-400"
        >
          📍 {value.lat}, {value.lng}
          {value.accuracy ? ` (±${value.accuracy}m)` : ""}
        </a>
      )}
    </div>
  );
}

function ImageControl({
  def,
  value,
  onChange,
}: {
  def: FieldDef;
  value: string;
  onChange: (key: string, value: unknown) => void;
}) {
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Upload failed");
        return;
      }
      onChange(def.key, data.url);
    } finally {
      setUploading(false);
    }
  }

  if (value) {
    return (
      <div className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={value} alt={def.label} className="size-12 rounded-md border object-cover" />
        <Button type="button" variant="ghost" size="sm" onClick={() => onChange(def.key, "")}>
          <X className="size-3.5" /> Remove
        </Button>
      </div>
    );
  }

  return (
    <label className="inline-flex">
      <Button type="button" variant="outline" size="sm" disabled={uploading} asChild>
        <span className="cursor-pointer">
          {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
          Upload photo
        </span>
      </Button>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />
    </label>
  );
}
