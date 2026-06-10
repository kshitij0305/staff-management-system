"use client";

import { useState } from "react";
import { format, subDays, startOfDay } from "date-fns";
import type { DateRange } from "react-day-picker";
import { CalendarIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export const RANGE_PRESETS = [
  { label: "Today", days: 0 },
  { label: "Last 3 days", days: 2 },
  { label: "Last 7 days", days: 6 },
  { label: "Last 30 days", days: 29 },
] as const;

export function presetRange(days: number): DateRange {
  return { from: startOfDay(subDays(new Date(), days)), to: new Date() };
}

export function DateRangePicker({
  value,
  onChange,
  className,
}: {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  const label = value?.from
    ? value.to
      ? `${format(value.from, "d MMM")} – ${format(value.to, "d MMM yyyy")}`
      : format(value.from, "d MMM yyyy")
    : "All time";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("justify-start font-normal", className)}>
          <CalendarIcon className="size-3.5 text-muted-foreground" />
          <span className="truncate">{label}</span>
          {value && (
            <span
              role="button"
              tabIndex={-1}
              aria-label="Clear date range"
              className="ml-auto rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                onChange(undefined);
              }}
            >
              <X className="size-3" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <div className="flex">
          <div className="flex flex-col gap-1 border-r p-2">
            {RANGE_PRESETS.map((p) => (
              <Button
                key={p.label}
                variant="ghost"
                size="sm"
                className="justify-start font-normal"
                onClick={() => {
                  onChange(presetRange(p.days));
                  setOpen(false);
                }}
              >
                {p.label}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="justify-start font-normal"
              onClick={() => {
                onChange(undefined);
                setOpen(false);
              }}
            >
              All time
            </Button>
          </div>
          <Calendar
            mode="range"
            numberOfMonths={2}
            selected={value}
            onSelect={onChange}
            defaultMonth={value?.from ?? subDays(new Date(), 30)}
            disabled={{ after: new Date() }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
