"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { ContactRound, Download, MapPin, Pencil, Plus, Search } from "lucide-react";
import { ProspectStatus, Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ProspectStatusBadge } from "@/components/badges";
import { UserAvatar } from "@/components/user-avatar";
import { EmptyState } from "@/components/empty-state";
import { TableSkeleton } from "@/components/skeletons";
import { TablePagination } from "@/components/table-pagination";
import { DateRangePicker, presetRange } from "@/components/date-range-picker";
import { useDebouncedValue } from "@/hooks/use-debounced";
import { useSession } from "@/components/shell/session-provider";
import { PROSPECT_STATUS_LABELS } from "@/lib/constants";
import type { ProspectRow } from "../types";
import { ProspectFormDialog } from "./prospect-form-dialog";

const PAGE_SIZE = 15;

export function ProspectsTable() {
  const session = useSession();
  const isManager = session.role !== Role.CPE;

  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q);
  const [status, setStatus] = useState<string>("ALL");
  const [employeeId, setEmployeeId] = useState<string>("ALL");
  // Spec default: show the last 3 days
  const [range, setRange] = useState<DateRange | undefined>(() => presetRange(2));
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState<ProspectRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const [employees, setEmployees] = useState<{ id: string; name: string }[] | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProspectRow | null>(null);

  useEffect(() => setPage(1), [debouncedQ, status, employeeId, range]);

  // Employee filter options (managers only)
  useEffect(() => {
    if (!isManager || employees !== null) return;
    fetch("/api/employees?pageSize=200&status=ACTIVE")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setEmployees(data?.employees ?? []))
      .catch(() => setEmployees([]));
  }, [isManager, employees]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (debouncedQ) params.set("q", debouncedQ);
    if (status !== "ALL") params.set("status", status);
    if (employeeId !== "ALL") params.set("employeeId", employeeId);
    if (range?.from) params.set("from", format(range.from, "yyyy-MM-dd"));
    if (range?.to ?? range?.from) params.set("to", format(range.to ?? range.from!, "yyyy-MM-dd"));
    return params.toString();
  }, [debouncedQ, status, employeeId, range, page]);

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    fetch(`/api/prospects?${queryString}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (cancelled) return;
        setRows(data.prospects);
        setTotal(data.total);
      })
      .catch(() => {
        if (!cancelled) {
          setRows([]);
          toast.error("Could not load prospects");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [queryString, version]);

  function exportCsv() {
    const params = new URLSearchParams(queryString);
    params.delete("page");
    params.delete("pageSize");
    window.open(`/api/prospects/export?${params}`, "_blank");
  }

  const isFiltered = debouncedQ !== "" || status !== "ALL" || employeeId !== "ALL";

  return (
    <div className="space-y-4">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1 sm:max-w-60">
          <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, phone, city…"
            className="pl-8"
          />
        </div>
        <DateRangePicker value={range} onChange={setRange} className="w-52" />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {Object.values(ProspectStatus).map((s) => (
              <SelectItem key={s} value={s}>
                {PROSPECT_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isManager && (
          <Select value={employeeId} onValueChange={setEmployeeId}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Collected by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Everyone</SelectItem>
              {(employees ?? []).map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={exportCsv}>
            <Download className="size-4" /> Export
          </Button>
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" /> Add prospect
          </Button>
        </div>
      </div>

      {/* table */}
      <div className="overflow-hidden rounded-xl border bg-card">
        {rows === null ? (
          <TableSkeleton rows={8} cols={6} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<ContactRound />}
            title={isFiltered || range ? "No prospects in this view" : "No prospects yet"}
            description={
              isFiltered || range
                ? "Widen the date range or clear the filters to see more."
                : "Every customer you visit goes here. Add your first prospect!"
            }
            action={
              <Button
                size="sm"
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                <Plus className="size-4" /> Add prospect
              </Button>
            }
            className="border-0"
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden md:table-cell">Location</TableHead>
                  <TableHead>Visit</TableHead>
                  {isManager && <TableHead className="hidden sm:table-cell">Collected by</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Remarks</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((p, i) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.25), duration: 0.2 }}
                    className="border-b last:border-0"
                  >
                    <TableCell>
                      <div className="leading-tight">
                        <div className="text-sm font-medium">{p.customerName}</div>
                        <div className="text-xs text-muted-foreground">{p.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="size-3" />
                        {p.city}, {p.state}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                      {format(new Date(p.visitDate), "d MMM")}
                    </TableCell>
                    {isManager && (
                      <TableCell className="hidden sm:table-cell">
                        <span className="flex items-center gap-1.5 text-sm">
                          <UserAvatar
                            name={p.collectedBy.name}
                            className="size-5"
                            textClassName="text-[8px]"
                          />
                          <span className="max-w-28 truncate">{p.collectedBy.name}</span>
                        </span>
                      </TableCell>
                    )}
                    <TableCell>
                      <ProspectStatusBadge status={p.status} />
                    </TableCell>
                    <TableCell className="hidden max-w-52 lg:table-cell">
                      {p.remarks ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="block truncate text-sm text-muted-foreground">
                              {p.remarks}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-64">{p.remarks}</TooltipContent>
                        </Tooltip>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Edit prospect"
                        onClick={() => {
                          setEditing(p);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
            <TablePagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
          </>
        )}
      </div>

      <ProspectFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        prospect={editing}
        onSaved={refresh}
      />
    </div>
  );
}
